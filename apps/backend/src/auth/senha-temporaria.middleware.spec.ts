import { HttpException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AuthMiddleware } from './auth.middleware';

describe('Restrições da sessão com senha temporária', () => {
  function ambiente(pendente: boolean) {
    const repo = { buscarPorEmail: jest.fn().mockResolvedValue({ id: 7, email: 'juliana@example.test', senha: 'hash', trocarSenhaObrigatoria: pendente }) };
    return new AuthMiddleware(repo as any);
  }
  function requisicao(caminho: string, temporaria = true) {
    const token = jwt.sign({ email: 'juliana@example.test', trocarSenhaObrigatoria: temporaria }, process.env.JWT_SECRET!, { expiresIn: '5m' });
    return { headers: { authorization: `Bearer ${token}` }, originalUrl: caminho };
  }
  let segredo: string | undefined;
  beforeEach(() => { segredo = process.env.JWT_SECRET; process.env.JWT_SECRET = 'segredo-exclusivo-deste-teste'; });
  afterEach(() => { if (segredo === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = segredo; });
  it('bloqueia operações antes da troca, com indicação específica', async () => {
    const next = jest.fn();
    try {
      await ambiente(true).use(requisicao('/equipe'), {}, next);
      throw new Error('Deveria bloquear a operação');
    } catch (erro) {
      expect(erro).toBeInstanceOf(HttpException);
      expect((erro as HttpException).getStatus()).toBe(403);
      expect((erro as HttpException).getResponse()).toEqual(expect.objectContaining({ codigo: 'TROCA_SENHA_OBRIGATORIA' }));
    }
    expect(next).not.toHaveBeenCalled();
  });
  it('permite o endpoint de troca da própria senha', async () => {
    const next = jest.fn(); await ambiente(true).use(requisicao('/auth/alterar-senha'), {}, next);
    expect(next).toHaveBeenCalled();
  });
  it('invalida tokens temporários emitidos antes da troca', async () => {
    const next = jest.fn();
    await expect(ambiente(false).use(requisicao('/equipe'), {}, next)).rejects.toMatchObject({ status: 401 });
    expect(next).not.toHaveBeenCalled();
  });
});
