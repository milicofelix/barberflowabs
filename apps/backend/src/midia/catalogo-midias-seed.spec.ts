import { vincularCatalogoMidias } from '../../prisma/seeds/vincular-catalogo-midias.seed';

describe('Padronização do catálogo sem sobrescrever unidades', () => {
  const midia = { id: 'm', escopo: 'GLOBAL', finalidade: 'SERVICO', ativo: true, status: 'DISPONIVEL', versoes: { principal: { url: '/midias/arquivos/m/principal' } } };
  function ambiente(itens: any[]) {
    const tx = { $queryRawUnsafe: jest.fn(), midia: { findUnique: jest.fn().mockResolvedValue(midia) }, servicoSugerido: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) }, midiaVinculo: { upsert: jest.fn() }, logAuditoria: { create: jest.fn() }, servico: { updateMany: jest.fn() } };
    const prisma = { servicoSugerido: { findMany: jest.fn().mockResolvedValue(itens) }, midia: { findUnique: jest.fn().mockResolvedValue(midia) }, $transaction: jest.fn((acao) => acao(tx)) };
    return { tx, prisma };
  }
  it('apenas simula por padrão', async () => {
    const { prisma } = ambiente([{ id: 1, imagemURL: '/servicos/combo.jpg' }]);
    expect(await vincularCatalogoMidias(prisma as any)).toEqual({ simulacao: true, candidatas: 1, atualizadas: 0 });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('escreve somente referência antiga conhecida e registra vínculo/auditoria', async () => {
    const { prisma, tx } = ambiente([{ id: 1, imagemURL: '/servicos/combo.jpg' }]);
    await vincularCatalogoMidias(prisma as any, true);
    expect(tx.servicoSugerido.updateMany).toHaveBeenCalledWith({ where: { id: 1, imagemURL: '/servicos/combo.jpg' }, data: { imagemURL: '/midias/arquivos/m/principal' } });
    expect(tx.midiaVinculo.upsert).toHaveBeenCalled(); expect(tx.logAuditoria.create).toHaveBeenCalled(); expect(tx.servico.updateMany).not.toHaveBeenCalled();
  });
  it('reexecução não altera referências já padronizadas', async () => {
    const { prisma } = ambiente([]);
    expect((await vincularCatalogoMidias(prisma as any, true)).atualizadas).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
