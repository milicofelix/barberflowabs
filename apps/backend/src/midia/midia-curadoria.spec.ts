import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MidiaService } from './midia.service';

describe('Curadoria global e isolamento', () => {
  const admin = { id: 1, papel: 'SUPER_ADMIN' }, cliente = { id: 7, papel: 'CUSTOMER', estabelecimentoId: 9 };
  const criar = (midia: any = { id: 'm', escopo: 'GLOBAL', ativo: true, finalidade: 'SERVICO' }) => {
    const tx = { $queryRawUnsafe: jest.fn(), midia: { findFirst: jest.fn().mockResolvedValue(midia), update: jest.fn().mockResolvedValue({ ...midia, ativo: false }), create: jest.fn() }, segmento: { findFirst: jest.fn().mockResolvedValue({ slug: 'barbearia' }) }, logAuditoria: { create: jest.fn() } };
    const prisma = { $transaction: jest.fn((acao) => acao(tx)), midia: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn().mockResolvedValue(midia) } };
    const storage = { processar: jest.fn(), ler: jest.fn().mockResolvedValue({ buffer: Buffer.from('imagem'), mime: 'image/webp' }) };
    return { tx, prisma, storage, service: new MidiaService(prisma as any, {} as any, storage as any) };
  };
  it('recusa cliente antes de listar ou processar upload global', async () => {
    const { service, prisma, storage } = criar();
    await expect(service.listarGlobal(cliente)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.upload(cliente, 'SERVICO', { buffer: Buffer.from('foto') }, true)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.midia.findMany).not.toHaveBeenCalled(); expect(storage.processar).not.toHaveBeenCalled();
  });
  it('edita metadados sem trocar arquivo, finalidade ou escopo e registra autor', async () => {
    const { service, tx } = criar();
    await service.atualizarGlobal(admin, 'm', { titulo: 'Corte', segmentoSlug: 'barbearia', ativo: false, finalidade: 'CAPA', escopo: 'USUARIO' });
    expect(tx.midia.update).toHaveBeenCalledWith({ where: { id: 'm' }, data: { titulo: 'Corte', segmentoSlug: 'barbearia', ativo: false } });
    expect(tx.logAuditoria.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usuarioId: 1, acao: 'CURADORIA' }) }));
  });
  it('não promove ou edita mídia privada de outra conta', async () => {
    const { service, tx } = criar(null);
    await expect(service.atualizarGlobal(admin, 'privada', { titulo: 'Foto', segmentoSlug: null, ativo: true })).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.midia.findFirst).toHaveBeenCalledWith({ where: { id: 'privada', escopo: 'GLOBAL', status: 'DISPONIVEL' } });
    expect(tx.midia.update).not.toHaveBeenCalled();
  });
  it('desativada continua sendo entregue às referências existentes', async () => {
    const { service, storage } = criar({ id: 'm', ativo: false, status: 'DISPONIVEL' });
    await expect(service.arquivo('m', 'principal')).resolves.toHaveProperty('mime', 'image/webp');
    expect(storage.ler).toHaveBeenCalled();
  });
  it('lista somente ativas globais ou da própria conta/unidade, nunca de outro tenant', async () => {
    const { service, prisma } = criar();
    await service.listar(cliente, 'SERVICO');
    const where = prisma.midia.findMany.mock.calls[0][0].where;
    expect(where.ativo).toBe(true);
    expect(where.AND[0].OR).toEqual([{ escopo: 'GLOBAL' }, { escopo: 'USUARIO', usuarioId: 7 }, { escopo: 'ESTABELECIMENTO', estabelecimentoId: 9 }]);
  });
});
