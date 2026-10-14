import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CatalogoAdminController } from './catalogo-admin.controller';

describe('Curadoria global de serviços', () => {
  const admin = { id: 7, papel: 'SUPER_ADMIN' };
  const dados = { nome: 'Limpeza de pele', slug: 'limpeza-de-pele', descricao: 'Atendimento facial', imagemURL: '/servicos/combo.jpg', segmentoId: 1, especialidadeIds: [2], ativo: false, ordem: 3, modeloAtendimento: 'PRESENCIAL', duracaoMinutos: 60, preparoAntesMinutos: 5, preparoDepoisMinutos: 10, deslocamentoMinutos: 0 };

  it('nega consulta e alteração ao gestor de uma unidade', async () => {
    const prisma = { $transaction: jest.fn() };
    const controller = new CatalogoAdminController(prisma as any);
    await expect(controller.listar({ papel: 'ESTABLISHMENT_OWNER' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.criar(dados, { papel: 'ESTABLISHMENT_OWNER' })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita modalidade e recursos inválidos antes de escrever', async () => {
    const prisma = { $transaction: jest.fn() };
    const controller = new CatalogoAdminController(prisma as any);
    await expect(controller.criar({ ...dados, modeloAtendimento: 'INVALIDO' }, admin)).rejects.toBeInstanceOf(BadRequestException);
    await expect(controller.criar({ ...dados, recursosNecessarios: [{ tipoRecurso: 'MACA', quantidade: 0 }] }, admin)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('salva desativação e auditoria na mesma transação sem alterar serviços importados', async () => {
    const tx = {
      $queryRawUnsafe: jest.fn(),
      segmento: { findUnique: jest.fn().mockResolvedValue({ id: 1 }) },
      especialidade: { count: jest.fn().mockResolvedValue(1) },
      requisito: { count: jest.fn().mockResolvedValue(0) },
      servicoSugerido: {
        findUnique: jest.fn().mockResolvedValue({ id: 4, ativo: true }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ id: 4, ativo: false }),
      },
      servicoSugeridoEspecialidade: { deleteMany: jest.fn() },
      logAuditoria: { create: jest.fn() },
      servico: { updateMany: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((acao) => acao(tx)) };
    await new CatalogoAdminController(prisma as any).atualizar('4', dados, admin);
    expect(tx.servicoSugerido.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ativo: false, ordem: 3 }) }));
    expect(tx.logAuditoria.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usuarioId: 7, entidadeId: '4', detalhes: expect.objectContaining({ anterior: { id: 4, ativo: true } }) }) }));
    expect(tx.servico.updateMany).not.toHaveBeenCalled();
  });
});
