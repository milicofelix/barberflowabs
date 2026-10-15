import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { validarCampanha } from './campanha.dto';
import { AudienciaCampanhaRepository } from './audiencia-campanha.repository';
import { CampanhaRepository } from './campanha.repository';
import { CampanhaController } from './campanha.controller';
import { CampanhaExecucaoRepository } from './campanha-execucao.repository';
import { DescadastroCampanhaService } from './descadastro-campanha.service';
import { ComunicacaoWorker } from '../comunicacao.worker';

describe('Campanhas segmentadas', () => {
  it.each([{ intervaloMinimoHoras: 0 }, { filtros: { desconhecido: true } }, { filtros: { tags: [''] } }, { templateId: -1 }])('recusa configuração inválida: %o', (dados) => {
    expect(() => validarCampanha({ nome: 'Campanha', templateId: 1, ...dados } as any)).toThrow(BadRequestException);
  });
  it('normaliza tags e aplica frequência conservadora por padrão', () => {
    expect(validarCampanha({ nome: ' Retorno ', templateId: 1, filtros: { tags: [' VIP ', 'VIP'] } })).toEqual({ nome: 'Retorno', templateId: 1, filtros: { tags: ['VIP'] }, intervaloMinimoHoras: 168 });
  });
  it('não cria campanha sem permissão', async () => {
    const repo = { salvar: jest.fn() };
    const controller = new CampanhaController(repo as any, {} as any, { validarPermissao: jest.fn().mockRejectedValue(new ForbiddenException()) } as any);
    await expect(controller.criar({ id: 1, estabelecimentoId: 2 } as any, { nome: 'Campanha', templateId: 1 })).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.salvar).not.toHaveBeenCalled();
  });
  it('congela apenas quem atende recorrência e inatividade da própria unidade', async () => {
    const tx = {
      clienteEstabelecimento: { findMany: jest.fn().mockResolvedValueOnce([{ id: 1, usuarioId: 10 }, { id: 2, usuarioId: 20 }]).mockResolvedValueOnce([]) },
      agendamento: { groupBy: jest.fn().mockResolvedValueOnce([{ usuarioId: 10, _count: { _all: 3 } }, { usuarioId: 20, _count: { _all: 5 } }]).mockResolvedValueOnce([{ usuarioId: 10, _max: { data: new Date('2026-09-01T12:00:00Z') } }, { usuarioId: 20, _max: { data: new Date('2026-10-14T12:00:00Z') } }]) },
    };
    const itens = await new AudienciaCampanhaRepository().selecionar(tx, 7, { tags: ['VIP'], servicoId: 4, recorrenciaMinima: 2, inatividadeDias: 30 }, new Date('2026-10-15T12:00:00Z'));
    expect(itens.map((item) => item.usuarioId)).toEqual([10]);
    expect(tx.clienteEstabelecimento.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ estabelecimentoId: 7, status: 'ATIVO' }), take: 250 }));
    expect(tx.agendamento.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ estabelecimentoId: 7, status: 'CONCLUIDO', servicos: { some: { id: 4 } } }) }));
  });
  it('repetir o congelamento não duplica audiência nem auditoria', async () => {
    const tx = { $queryRaw: jest.fn(), campanhaComunicacao: { findFirst: jest.fn().mockResolvedValue({ id: 8, audienciaCongeladaEm: new Date() }) }, campanhaDestinatario: { count: jest.fn().mockResolvedValue(2), createMany: jest.fn() }, logAuditoria: { create: jest.fn() } };
    const repo = new CampanhaRepository({ $transaction: jest.fn((cb) => cb(tx)) } as any, {} as any);
    await expect(repo.congelar(8, 7, 1)).resolves.toEqual({ id: 8, congelada: true, total: 2 });
    expect(tx.campanhaDestinatario.createMany).not.toHaveBeenCalled(); expect(tx.logAuditoria.create).not.toHaveBeenCalled();
  });
  it('envio sem consentimento é cancelado antes do provedor', async () => {
    const envio = { id: 5, campanhaId: 8, estabelecimentoId: 7, usuarioId: 10, canal: 'EMAIL', destinatario: 'teste@example.test', status: 'PROCESSANDO', bloqueadoPor: 'worker' };
    const tx = { $queryRaw: jest.fn(), campanhaComunicacao: { findFirst: jest.fn().mockResolvedValue({ id: 8, estabelecimentoId: 7, status: 'EM_EXECUCAO', templateSnapshot: { canal: 'EMAIL' } }) }, envioComunicacao: { findFirst: jest.fn().mockResolvedValue(envio), updateMany: jest.fn() }, clienteEstabelecimento: { findFirst: jest.fn().mockResolvedValue({ usuario: { email: 'teste@example.test' } }) }, preferenciaComunicacao: { findUnique: jest.fn().mockResolvedValue({ consentido: false }) }, supressaoComunicacao: { findUnique: jest.fn().mockResolvedValue(null) } };
    const repo = new CampanhaExecucaoRepository({ $transaction: jest.fn((cb) => cb(tx)) } as any, {} as any);
    await expect(repo.autorizar(envio)).resolves.toBe(false);
    expect(tx.envioComunicacao.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELADO', erro: 'SEM_CONSENTIMENTO' }) }));
  });
  it('campanha pausada adia a mensagem sem consumir tentativa', async () => {
    const tx = { $queryRaw: jest.fn(), campanhaComunicacao: { findFirst: jest.fn().mockResolvedValue({ status: 'PAUSADA' }) }, envioComunicacao: { findFirst: jest.fn().mockResolvedValue({ id: 5 }), updateMany: jest.fn() } };
    const repo = new CampanhaExecucaoRepository({ $transaction: jest.fn((cb) => cb(tx)) } as any, {} as any);
    await expect(repo.autorizar({ id: 5, campanhaId: 8, estabelecimentoId: 7, bloqueadoPor: 'worker' }, new Date('2026-10-15T12:00:00Z'))).resolves.toBe(false);
    expect(tx.envioComunicacao.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'AGENDADO', agendadoPara: new Date('2026-10-15T12:01:00Z') }) }));
  });
  it('o worker não chama provedor nem inicia tentativa se a campanha for recusada', async () => {
    const repo = { reivindicarProximo: jest.fn().mockResolvedValueOnce({ id: 5, campanhaId: 8 }).mockResolvedValueOnce(null), iniciarTentativa: jest.fn() };
    const providers = { obter: jest.fn() };
    await new ComunicacaoWorker(repo as any, providers as any, { autorizar: jest.fn().mockResolvedValue(false) } as any).processarLote();
    expect(repo.iniciarTentativa).not.toHaveBeenCalled(); expect(providers.obter).not.toHaveBeenCalled();
  });
  it.each([4, 5])('a reserva de frequência bloqueia outro envio e permite retry do mesmo: %s', async (ultimoEnvioId) => {
    const agora = new Date('2026-10-15T12:00:00Z');
    const envio = { id: 5, campanhaId: 8, estabelecimentoId: 7, usuarioId: 10, canal: 'EMAIL', destinatario: 'teste@example.test', bloqueadoPor: 'worker' };
    const tx = {
      $queryRaw: jest.fn().mockResolvedValueOnce([{ id: 8 }]).mockResolvedValueOnce([{ consentido: true, revogadoEm: null }]).mockResolvedValueOnce([{ ativa: false, ultimoDisparoEm: new Date('2026-10-15T11:00:00Z'), ultimoEnvioId, intervaloReservadoHoras: 168 }]),
      campanhaComunicacao: { findFirst: jest.fn().mockResolvedValue({ id: 8, estabelecimentoId: 7, status: 'EM_EXECUCAO', intervaloMinimoHoras: 24, templateSnapshot: { canal: 'EMAIL' } }) },
      envioComunicacao: { findFirst: jest.fn().mockResolvedValueOnce(envio).mockResolvedValueOnce(null), updateMany: jest.fn() },
      clienteEstabelecimento: { findFirst: jest.fn().mockResolvedValue({ usuario: { email: 'teste@example.test' } }) },
      preferenciaComunicacao: { findUnique: jest.fn().mockResolvedValue({ consentido: true, revogadoEm: null }) },
      supressaoComunicacao: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn(), update: jest.fn() },
    };
    const repo = new CampanhaExecucaoRepository({ $transaction: jest.fn((cb) => cb(tx)) } as any, {} as any);
    await expect(repo.autorizar(envio, agora)).resolves.toBe(ultimoEnvioId === 5);
    if (ultimoEnvioId === 4) expect(tx.supressaoComunicacao.update).not.toHaveBeenCalled();
    else expect(tx.supressaoComunicacao.update).toHaveBeenCalled();
  });
  it('token de descadastro tem escopo próprio e não aceita alteração', () => {
    const anterior = process.env.AGENDAMENTO_ACAO_SECRET;
    process.env.AGENDAMENTO_ACAO_SECRET = 'segredo-isolado-de-teste';
    try {
      const service = new DescadastroCampanhaService({} as any);
      const token = new URL(service.url(7, 10, 'EMAIL')).searchParams.get('token')!;
      expect(service.consultar(token)).toEqual({ estabelecimentoId: 7, usuarioId: 10, canal: 'EMAIL' });
      expect(() => service.consultar(`${token}alterado`)).toThrow();
    } finally { if (anterior === undefined) delete process.env.AGENDAMENTO_ACAO_SECRET; else process.env.AGENDAMENTO_ACAO_SECRET = anterior; }
  });
});
