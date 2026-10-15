import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { periodoMetricas, cursorGovernanca, taxa, validarPolitica } from './governanca.dto';
import { PrivacidadeSolicitacaoRepository } from './privacidade-solicitacao.repository';
import { PrivacidadeExportacaoRepository } from './privacidade-exportacao.repository';
import { PrivacidadeExclusaoRepository } from './privacidade-exclusao.repository';
import { RetencaoRelacionamentoRepository, expurgarEnvios } from './retencao-relacionamento.repository';
import { MetricasRelacionamentoRepository } from './metricas-relacionamento.repository';
import { GovernancaController } from './governanca.controller';
import { RelacionamentoRepository } from '../relacionamento.repository';
import { bloquearClienteComunicacao } from './privacidade-comunicacao';

const executar = (tx: any) => ({ $transaction: jest.fn((fn) => fn(tx)) }) as any;
const solicitacao = { id: 3, estabelecimentoId: 7, clienteId: 5, tipo: 'EXCLUSAO', identidadeValidadaEm: new Date(), cliente: { id: 5, usuarioId: 9, estabelecimentoId: 7 } };
const confirmacao = { confirmacao: 'EXCLUIR_DADOS_RELACIONAMENTO', motivoConservacao: 'Revisão registrada pelo encarregado para registros operacionais vinculados' };

describe('Contratos e métricas de relacionamento', () => {
  it('exige período ISO com fuso e limita a 93 dias', () => {
    expect(() => periodoMetricas('2026-10-01', '2026-10-15')).toThrow(BadRequestException);
    expect(() => periodoMetricas('2026-01-01T00:00:00Z', '2026-10-01T00:00:00Z')).toThrow(BadRequestException);
    expect(() => cursorGovernanca('-1')).toThrow(BadRequestException);
    expect(taxa(0, 0)).toBeNull(); expect(taxa(1, 4)).toBe(25);
  });
  it('converte agregados do banco, distingue observação de suporte e mantém denominador de retenção', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValueOnce([{ total: 10n, aceitos: 8n, entregues: 7n, abertos: 0n, clicados: 2n, cancelados: 1n, falhas: 1n }]).mockResolvedValueOnce([{ reservas: 2n, concluidos: 1n, cancelamentos: 1n, receita: '130.00', recebido: '50.00' }]).mockResolvedValueOnce([{ clientes: 4n, retornaram: 2n, novos: 1n, reativados: 1n, retidos: 2n }]).mockResolvedValueOnce([{ total: 8n }]) };
    const dados = await new MetricasRelacionamentoRepository(prisma as any).obter(7, periodoMetricas('2026-10-01T00:00:00Z', '2026-10-15T00:00:00Z'));
    expect(dados.funil.taxaAberturaObservadaSobreEntregues).toBeNull();
    expect(dados.atribuicao).toMatchObject({ receitaLiquida: 130, valorRecebidoAtual: 50 });
    expect(dados.clientes.taxaRetencao).toBe(25);
    expect(() => JSON.stringify(dados)).not.toThrow();
    for (const chamada of prisma.$queryRaw.mock.calls) expect(chamada.slice(1)).toContain(7);
  });
  it('não consulta métricas de campanha de outro tenant', async () => {
    const prisma = { campanhaComunicacao: { findFirst: jest.fn().mockResolvedValue(null) }, $queryRaw: jest.fn() };
    await expect(new MetricasRelacionamentoRepository(prisma as any).obter(7, { inicio: new Date(), fim: new Date(), campanhaId: 99 })).rejects.toThrow(NotFoundException);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});

describe('Solicitações e exportação', () => {
  it('isola solicitação e exige identidade validada antes de exportar', async () => {
    const tx = { solicitacaoPrivacidade: { findFirst: jest.fn().mockResolvedValue(null) } };
    const repo = new PrivacidadeExportacaoRepository(executar(tx));
    await expect(repo.exportar(8, 1, 3, 'perfil', 0)).rejects.toThrow(NotFoundException);
    tx.solicitacaoPrivacidade.findFirst.mockResolvedValue({ ...solicitacao, tipo: 'EXPORTACAO', identidadeValidadaEm: null } as any);
    await expect(repo.exportar(7, 1, 3, 'perfil', 0)).rejects.toThrow(ConflictException);
  });
  it('exportação usa whitelist, tenant e página de cem itens, sem senha', async () => {
    const tx = { solicitacaoPrivacidade: { findFirst: jest.fn().mockResolvedValue({ ...solicitacao, tipo: 'EXPORTACAO' }) }, clienteEstabelecimento: { findFirst: jest.fn().mockResolvedValue({ id: 5 }) }, logAuditoria: { create: jest.fn() } };
    await new PrivacidadeExportacaoRepository(executar(tx)).exportar(7, 1, 3, 'perfil', 0);
    const consulta = tx.clienteEstabelecimento.findFirst.mock.calls[0][0];
    expect(consulta.where).toEqual({ id: 5, estabelecimentoId: 7 });
    expect(consulta.select.usuario.select).not.toHaveProperty('senha');
  });
  it('chave reutilizada não abre uma solicitação diferente', async () => {
    const tx = { $queryRaw: jest.fn(), clienteEstabelecimento: { findFirst: jest.fn().mockResolvedValue({ id: 5 }) }, solicitacaoPrivacidade: { findUnique: jest.fn().mockResolvedValue({ id: 3, clienteId: 5, tipo: 'EXPORTACAO' }) } };
    await expect(new PrivacidadeSolicitacaoRepository(executar(tx)).criar(7, 1, { clienteId: 5, tipo: 'EXCLUSAO', chaveIdempotencia: 'mesma' })).rejects.toThrow(ConflictException);
  });
});

describe('Exclusão parcial e retenção', () => {
  function cenario(status = 'ENVIADO') {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 10, status }]),
      solicitacaoPrivacidade: { findFirst: jest.fn().mockResolvedValue(solicitacao), update: jest.fn(async ({ data }) => ({ ...solicitacao, ...data })) },
      preferenciaComunicacao: { upsert: jest.fn() }, supressaoComunicacao: { upsert: jest.fn() },
      envioComunicacao: { updateMany: jest.fn() }, callbackEnvioComunicacao: { updateMany: jest.fn() }, tentativaEnvioComunicacao: { updateMany: jest.fn() },
      campanhaDestinatario: { updateMany: jest.fn() }, lembreteRelacionamento: { deleteMany: jest.fn() },
      importacaoContatoItem: { findMany: jest.fn().mockResolvedValue([]) }, clienteEstabelecimento: { update: jest.fn() }, logAuditoria: { create: jest.fn() },
    };
    return { tx, repo: new PrivacidadeExclusaoRepository(executar(tx)) };
  }
  it('não executa sem confirmação e impede exclusão com provedor em andamento', async () => {
    const c = cenario('PROCESSANDO');
    expect(() => c.repo.executar(7, 1, 3, { ...confirmacao, confirmacao: '' })).toThrow(BadRequestException);
    await expect(c.repo.executar(7, 1, 3, confirmacao)).rejects.toThrow(ConflictException);
    expect(c.tx.preferenciaComunicacao.upsert).not.toHaveBeenCalled();
  });
  it('expurga relacionamento e revoga canais sem apagar conta global ou financeiro', async () => {
    const c = cenario(); const resultado = await c.repo.executar(7, 1, 3, confirmacao);
    expect(resultado.status).toBe('ATENDIDA_PARCIAL');
    expect(resultado.resultado.exclusaoIntegral).toBe(false);
    expect(c.tx.preferenciaComunicacao.upsert).toHaveBeenCalledTimes(3);
    expect(c.tx.clienteEstabelecimento.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'BLOQUEADO', tags: [], observacoes: null }) }));
    expect(c.tx.envioComunicacao.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: [10] }, estabelecimentoId: 7 }, data: expect.objectContaining({ conteudo: '[EXPURGADO]' }) }));
    c.tx.solicitacaoPrivacidade.findFirst.mockResolvedValue(resultado);
    await c.repo.executar(7, 1, 3, confirmacao);
    expect(c.tx.logAuditoria.create).toHaveBeenCalledTimes(1);
  });
  it('política não tem prazo legal implícito e precisa estar ativa para executar', async () => {
    expect(() => validarPolitica({ ativa: true, conteudoDias: 0, fundamento: 'x' })).toThrow(BadRequestException);
    const tx = { $queryRaw: jest.fn(), politicaRetencaoRelacionamento: { findUnique: jest.fn().mockResolvedValue(null) } };
    await expect(new RetencaoRelacionamentoRepository(executar(tx)).executar(7, 1, 'EXPURGAR_CONTEUDO_VENCIDO')).rejects.toThrow(ConflictException);
  });
  it('expurgo não remove callbacks ou seus tipos/horários usados nas métricas', async () => {
    const tx = { callbackEnvioComunicacao: { updateMany: jest.fn() }, tentativaEnvioComunicacao: { updateMany: jest.fn() }, envioComunicacao: { updateMany: jest.fn() } };
    await expurgarEnvios(tx, 7, [10], new Date());
    expect(tx.callbackEnvioComunicacao.updateMany).toHaveBeenCalledWith({ where: { envio: { id: { in: [10] }, estabelecimentoId: 7 } }, data: { payload: {}, erro: null } });
  });
});

describe('Autorizações e bloqueio de reidentificação', () => {
  it('callback tardio não restaura payload ou metadados expurgados', async () => {
    const tx = { $queryRaw: jest.fn(), envioComunicacao: { findUnique: jest.fn().mockResolvedValue({ dadosExpurgadosEm: new Date(), status: 'ENVIADO' }), update: jest.fn() }, callbackEnvioComunicacao: { create: jest.fn().mockResolvedValue({ id: 22 }) } };
    const prisma = { ...executar(tx), envioComunicacao: { findFirst: jest.fn().mockResolvedValue({ id: 10 }) }, callbackEnvioComunicacao: { findUnique: jest.fn().mockResolvedValue(null) } };
    await new RelacionamentoRepository(prisma).registrarCallback('email-simulado', { eventoId: 'novo-evento', referenciaExterna: 'ref', tipo: 'ENTREGUE', payload: { email: 'dado-pessoal' } });
    expect(tx.callbackEnvioComunicacao.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ payload: {} }) }));
    expect(tx.envioComunicacao.update).not.toHaveBeenCalled();
  });
  it('cliente restrito não pode receber novo consentimento/envio por edição comum', async () => {
    const tx = { $queryRaw: jest.fn(), clienteEstabelecimento: { findUnique: jest.fn().mockResolvedValue({ privacidadeRestritaEm: new Date() }) } };
    await expect(bloquearClienteComunicacao(tx, 7, 9)).rejects.toThrow(ConflictException);
  });
  it('gate do worker cancela e expurga antes de enviar ao provedor', async () => {
    const tx = { $queryRaw: jest.fn(), envioComunicacao: { findFirst: jest.fn().mockResolvedValue({ id: 10 }), update: jest.fn(), updateMany: jest.fn() }, clienteEstabelecimento: { findUnique: jest.fn().mockResolvedValue({ privacidadeRestritaEm: new Date() }) }, callbackEnvioComunicacao: { updateMany: jest.fn() }, tentativaEnvioComunicacao: { updateMany: jest.fn() } };
    await expect(new RelacionamentoRepository(executar(tx)).autorizarPrivacidade({ id: 10, usuarioId: 9, estabelecimentoId: 7, bloqueadoPor: 'worker' })).resolves.toBe(false);
    expect(tx.envioComunicacao.updateMany).toHaveBeenCalled();
  });
  it('sem permissão a solicitação não chega ao repositório', async () => {
    const req = { criar: jest.fn() } as any;
    const controller = new GovernancaController({} as any, {} as any, req, {} as any, {} as any, {} as any, { validarPermissao: jest.fn().mockRejectedValue(new ForbiddenException()) } as any);
    await expect(controller.solicitar({ id: 1, estabelecimentoId: 7 } as any, { clienteId: 5, tipo: 'EXCLUSAO', chaveIdempotencia: 'teste' })).rejects.toThrow(ForbiddenException);
    expect(req.criar).not.toHaveBeenCalled();
  });
});
