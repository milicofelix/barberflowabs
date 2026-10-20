import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ServicoPrisma } from './servico.prisma';
import { ServicoController } from './servico.controller';

const sugestao = (id = 1, segmentoId = 10) => ({
  id, segmentoId, nome: `Serviço ${id}`, descricao: 'Descrição', imagemURL: '/servicos/combo.jpg',
  modeloAtendimento: 'PRESENCIAL', duracaoMinutos: 45, preparoAntesMinutos: 5,
  preparoDepoisMinutos: 10, deslocamentoMinutos: 15,
  especialidades: [{ especialidadeId: 20 }],
  requisitosOperacionais: [{ requisitoId: 30, obrigatorio: true }],
  recursosNecessarios: [{ tipoRecurso: 'MACA', quantidade: 1 }],
});

function ambiente() {
  const registros: any[] = [];
  const unidade: any = { status: 'ACTIVE', modeloAtendimento: 'HIBRIDO', segmentos: [{ segmentoId: 10 }, { segmentoId: 11 }], especialidades: [{ especialidadeId: 20 }], assinatura: null, _count: { servicos: 0 } };
  const tx = {
    $queryRawUnsafe: jest.fn().mockResolvedValue([{ id: 9 }]),
    estabelecimento: { findUnique: jest.fn(async () => ({ ...unidade, _count: { servicos: registros.length } })) },
    servicoSugerido: { findMany: jest.fn().mockResolvedValue([sugestao(), sugestao(2, 11)]) },
    profissional: { count: jest.fn().mockResolvedValue(1) },
    servico: {
      findMany: jest.fn(async () => registros),
      create: jest.fn(async ({ data }: any) => {
        const criado = { ...data, id: registros.length + 100, profissionaisHabilitados: data.profissionaisHabilitados?.create ?? [] };
        registros.push(criado); return criado;
      }),
    },
  };
  const prisma = { $transaction: jest.fn(async (acao) => {
    const antes = registros.length;
    try { return await acao(tx); } catch (e) { registros.splice(antes); throw e; }
  }) };
  return { repo: new ServicoPrisma(prisma as any), tx, unidade, registros };
}

describe('Aceite do catálogo sugerido', () => {
  it('copia dados de dois segmentos com preparação, requisitos e profissionais do tenant', async () => {
    const { repo, tx } = ambiente();
    const resultado = await repo.importarSugeridos(9, { itens: [{ servicoSugeridoId: 1, preco: 50, profissionalIds: [7] }, { servicoSugeridoId: 2, preco: 80 }] });
    expect(resultado.criados).toHaveLength(2);
    expect(tx.servico.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ estabelecimentoId: 9, deslocamentoMinutos: 0, requisitos: { create: [{ requisitoId: 30, obrigatorio: true }] }, recursosNecessarios: { create: [{ tipoRecurso: 'MACA', quantidade: 1 }] } }) }));
    expect(tx.profissional.count).toHaveBeenCalledWith({ where: { estabelecimentoId: 9, id: { in: [7] } } });
    expect(tx.servicoSugerido.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ segmentoId: { in: [10, 11] }, ativo: true, segmento: { ativo: true } }) }));
  });

  it('repetição não duplica nem modifica o preço do serviço já importado', async () => {
    const { repo, registros } = ambiente();
    await repo.importarSugeridos(9, { itens: [{ servicoSugeridoId: 1, preco: 50 }] });
    const repetido = await repo.importarSugeridos(9, { itens: [{ servicoSugeridoId: 1, preco: 999 }] });
    expect(repetido.criados).toHaveLength(0);
    expect(repetido.ignorados).toHaveLength(1);
    expect(registros).toHaveLength(1);
    expect(registros[0].preco).toBe(50);
  });

  it('limite recusa o lote inteiro antes de criar qualquer serviço', async () => {
    const { repo, unidade, tx } = ambiente();
    unidade.assinatura = { plano: { limiteServicos: 1 } };
    await expect(repo.importarSugeridos(9, { itens: [{ servicoSugeridoId: 1, preco: 50 }, { servicoSugeridoId: 2, preco: 60 }] })).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.servico.create).not.toHaveBeenCalled();
  });

  it('assinatura bloqueada impede gravação mesmo após verificação inicial', async () => {
    const { repo, unidade, tx } = ambiente(); unidade.status = 'SUSPENDED';
    await expect(repo.importarSugeridos(9, { itens: [{ servicoSugeridoId: 1, preco: 50 }] })).rejects.toBeInstanceOf(ForbiddenException);
    expect(tx.servico.create).not.toHaveBeenCalled();
  });

  it('profissional de outra unidade invalida o lote e reverte as criações anteriores', async () => {
    const { repo, tx, registros } = ambiente(); tx.profissional.count.mockResolvedValue(0);
    await expect(repo.importarSugeridos(9, { itens: [{ servicoSugeridoId: 1, preco: 50 }, { servicoSugeridoId: 2, preco: 80, profissionalIds: [123] }] })).rejects.toBeInstanceOf(BadRequestException);
    expect(registros).toHaveLength(0);
  });

  it('preserva serviço manual de mesmo nome e ignora sugestões indisponíveis', async () => {
    const { repo, registros, tx } = ambiente(); registros.push({ nome: 'SERVIÇO 1', id: 100 });
    const resultado = await repo.importarSugeridos(9, { itens: [{ servicoSugeridoId: 1, preco: 50 }, { servicoSugeridoId: 999, preco: 50 }] });
    expect(resultado.ignorados).toHaveLength(2);
    expect(tx.servico.create).not.toHaveBeenCalled();
  });

  it('permissão negada interrompe importação antes de acessar o repositório', async () => {
    const repo = { importarSugeridos: jest.fn() };
    const policy = { validarPermissao: jest.fn().mockRejectedValue(new ForbiddenException()) };
    const controller = new ServicoController(repo as any, {} as any, {} as any, policy as any);
    await expect(controller.importarSugeridos({ itens: [{ servicoSugeridoId: 1, preco: 50 }] }, { membroEstabelecimento: true } as any)).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.importarSugeridos).not.toHaveBeenCalled();
  });

  it('item nulo retorna validação em vez de erro interno', async () => {
    const controller = new ServicoController({} as any, {} as any, {} as any, { validarPermissao: jest.fn() } as any);
    await expect(controller.importarSugeridos({ itens: [null] } as any, { membroEstabelecimento: true } as any)).rejects.toBeInstanceOf(BadRequestException);
  });
});
