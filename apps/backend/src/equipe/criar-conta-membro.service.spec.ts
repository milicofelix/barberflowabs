import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CriarContaMembroService } from './criar-conta-membro.service';

describe('Cadastro de membro com conta', () => {
  const operador = { id: 7, estabelecimentoId: 9 };
  const dados = { email: ' JULIANA@example.test ', senhaTemporaria: 'Temporaria-123', profissionalId: 10, papel: 'PROFISSIONAL', permissoes: ['AGENDA_GERENCIAR' as const] };
  function ambiente() {
    const tx = {
      usuario: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 11 }) },
      profissional: { findFirst: jest.fn().mockResolvedValue({ id: 10, nome: 'Juliana Sales', vinculoEquipe: null }) },
      membroEquipe: { create: jest.fn().mockResolvedValue({ id: 12, usuarioId: 11, profissionalId: 10 }) },
      logAuditoria: { create: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((acao) => acao(tx)) };
    const policy = { validarPermissao: jest.fn(), validarAcesso: jest.fn() };
    const cripto = { criptografar: jest.fn().mockResolvedValue('hash-da-senha') };
    return { tx, prisma, policy, service: new CriarContaMembroService(prisma as any, cripto as any, policy as any) };
  }
  it('cria conta restrita e membro na unidade do operador, sem expor senha no retorno/auditoria', async () => {
    const { service, tx, policy } = ambiente();
    const resultado = await service.executar(operador, dados);
    expect(policy.validarPermissao).toHaveBeenCalledWith(operador, 'EQUIPE_GERENCIAR');
    expect(tx.profissional.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 10, estabelecimentoId: 9 } }));
    expect(tx.usuario.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      nome: 'Juliana Sales', email: 'juliana@example.test', senha: 'hash-da-senha',
      papel: 'ESTABLISHMENT_MEMBER', estabelecimentoId: 9, trocarSenhaObrigatoria: true,
    }) }));
    expect(tx.membroEquipe.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ usuarioId: 11, profissionalId: 10, permissoes: dados.permissoes }) }));
    expect(JSON.stringify([resultado, tx.logAuditoria.create.mock.calls])).not.toContain(dados.senhaTemporaria);
    expect(JSON.stringify(resultado)).not.toContain('hash-da-senha');
  });
  it('não altera ou recria uma conta cujo e-mail já existe', async () => {
    const { service, tx } = ambiente(); tx.usuario.findUnique.mockResolvedValue({ id: 15 });
    await expect(service.executar(operador, dados)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.usuario.create).not.toHaveBeenCalled();
  });
  it('não cria conta quando o profissional pertence a outra unidade', async () => {
    const { service, tx } = ambiente(); tx.profissional.findFirst.mockResolvedValue(null);
    await expect(service.executar(operador, dados)).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.usuario.create).not.toHaveBeenCalled();
  });
  it('bloqueia o cadastro antes da transação quando faltam permissões', async () => {
    const { service, prisma, policy } = ambiente(); policy.validarPermissao.mockRejectedValue(new ForbiddenException());
    await expect(service.executar(operador, dados)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
