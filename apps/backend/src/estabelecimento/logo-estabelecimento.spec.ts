import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LogoEstabelecimentoRepository } from './logo-estabelecimento.repository';
import { EstabelecimentoController } from './estabelecimento.controller';

function cenario(midia: any = null, logoURL: string | null = null) {
  const atual = { id: 7, logoModo: 'PADRAO', logoURL };
  const tx = {
    $queryRaw: jest.fn(),
    estabelecimento: { findUnique: jest.fn().mockResolvedValue(atual), update: jest.fn(async ({ data }) => ({ ...atual, ...data })) },
    midia: { findFirst: jest.fn().mockResolvedValue(midia) },
    midiaVinculo: { deleteMany: jest.fn(), create: jest.fn() },
    logAuditoria: { create: jest.fn() },
  };
  const repo = new LogoEstabelecimentoRepository({ $transaction: jest.fn((fn) => fn(tx)) } as any);
  return { tx, repo };
}
const id = '86d05a36-762f-4bb4-96cd-837be25e1531';

describe('Identidade do estabelecimento', () => {
  it('recusa alteração por cliente ou membro que não seja o dono', () => {
    const logos = { salvar: jest.fn() } as any;
    const controller = new EstabelecimentoController({} as any, logos);
    for (const papel of ['CUSTOMER', 'ESTABLISHMENT_MEMBER', 'SUPER_ADMIN']) {
      expect(() => controller.salvarLogo({ id: 1, estabelecimentoId: 7, papel } as any, { logoModo: 'OCULTO' })).toThrow(ForbiddenException);
    }
    expect(logos.salvar).not.toHaveBeenCalled();
  });
  it('oculta ou restaura o padrão sem apagar o logo guardado nem alterar o banner', async () => {
    const c = cenario(null, '/midias/arquivos/anterior/principal');
    const r = await c.repo.salvar(7, 1, { logoModo: 'OCULTO' });
    expect(r).toMatchObject({ logoModo: 'OCULTO', logoURL: '/midias/arquivos/anterior/principal' });
    expect(c.tx.estabelecimento.update).toHaveBeenCalledWith(expect.objectContaining({ data: { logoModo: 'OCULTO', logoURL: '/midias/arquivos/anterior/principal' } }));
    expect(c.tx.midiaVinculo.deleteMany).not.toHaveBeenCalled();
    await c.repo.salvar(7, 1, { logoModo: 'PADRAO' });
    expect(c.tx.logAuditoria.create).toHaveBeenCalledTimes(2);
  });
  it('personalizado exige um logo e não aceita URL digitada no payload', async () => {
    const c = cenario();
    await expect(c.repo.salvar(7, 1, { logoModo: 'PERSONALIZADO', logoURL: 'https://externo.invalid/a.png' } as any)).rejects.toThrow(BadRequestException);
    expect(c.tx.estabelecimento.update).not.toHaveBeenCalled();
  });
  it('valida mídia por tenant, escopo, disponibilidade e finalidade', async () => {
    const c = cenario();
    await expect(c.repo.salvar(7, 1, { logoModo: 'PERSONALIZADO', midiaId: id })).rejects.toThrow(BadRequestException);
    expect(c.tx.midia.findFirst).toHaveBeenCalledWith({ where: { id, estabelecimentoId: 7, escopo: 'ESTABELECIMENTO', finalidade: 'LOGO', ativo: true, status: 'DISPONIVEL' } });
    expect(c.tx.midiaVinculo.create).not.toHaveBeenCalled();
  });
  it('associa logo sem remover o vínculo da capa e grava auditoria', async () => {
    const c = cenario({ id, versoes: { principal: { url: `/midias/arquivos/${id}/principal` } } });
    const r = await c.repo.salvar(7, 1, { logoModo: 'PERSONALIZADO', midiaId: id });
    expect(r.logoModo).toBe('PERSONALIZADO');
    expect(c.tx.midiaVinculo.deleteMany).toHaveBeenCalledWith({ where: { entidade: 'ESTABELECIMENTO_LOGO', entidadeId: 7 } });
    expect(c.tx.logAuditoria.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ estabelecimentoId: 7, usuarioId: 1, acao: 'ESTABELECIMENTO_LOGO_ALTERADO' }) }));
  });
  it('recusa modos e identificadores inválidos antes da transação', () => {
    const c = cenario();
    expect(() => c.repo.salvar(7, 1, { logoModo: 'OUTRO' })).toThrow(BadRequestException);
    expect(() => c.repo.salvar(7, 1, { logoModo: 'PERSONALIZADO', midiaId: '../arquivo' })).toThrow(BadRequestException);
  });
});
