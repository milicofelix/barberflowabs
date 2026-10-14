import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AlterarSenhaService } from './alterar-senha.service';

describe('Substituição da senha temporária', () => {
  function ambiente() {
    const repo = { buscarPorEmail: jest.fn().mockResolvedValue({ id: 7, email: 'juliana@example.test', senha: 'hash-anterior', trocarSenhaObrigatoria: true }), alterarSenha: jest.fn().mockResolvedValue(true) };
    const cripto = { comparar: jest.fn().mockResolvedValue(true), criptografar: jest.fn().mockResolvedValue('hash-novo') };
    return { repo, cripto, service: new AlterarSenhaService(repo as any, cripto as any) };
  }
  const dados = { senhaAtual: 'Temporaria-123', novaSenha: 'Pessoal-456' };
  it('exige senha atual e atualiza o hash sem devolver a senha', async () => {
    const { service, repo, cripto } = ambiente();
    const usuario = await service.executar('juliana@example.test', dados);
    expect(cripto.comparar).toHaveBeenCalledWith(dados.senhaAtual, 'hash-anterior');
    expect(repo.alterarSenha).toHaveBeenCalledWith(7, 'hash-anterior', 'hash-novo');
    expect(usuario.trocarSenhaObrigatoria).toBe(false);
    expect(usuario).not.toHaveProperty('senha');
  });
  it('rejeita senha atual incorreta sem alterar a conta', async () => {
    const { service, repo, cripto } = ambiente(); cripto.comparar.mockResolvedValue(false);
    await expect(service.executar('juliana@example.test', dados)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(repo.alterarSenha).not.toHaveBeenCalled();
  });
  it('não permite manter a senha temporária', async () => {
    const { service, repo } = ambiente();
    await expect(service.executar('juliana@example.test', { ...dados, novaSenha: dados.senhaAtual })).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.alterarSenha).not.toHaveBeenCalled();
  });
  it('rejeita alteração concorrente quando o hash anterior já mudou', async () => {
    const { service, repo } = ambiente(); repo.alterarSenha.mockResolvedValue(false);
    await expect(service.executar('juliana@example.test', dados)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
