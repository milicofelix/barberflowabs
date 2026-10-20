import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { BcryptProvider } from './bcrypt.provider';
import { UsuarioPrisma } from './usuario.prisma';
import { AlterarSenhaDto } from './auth.dto';
import { validarSenha } from 'src/shared/validacao';

@Injectable()
export class AlterarSenhaService {
  constructor(private readonly repo: UsuarioPrisma, private readonly cripto: BcryptProvider) {}

  async executar(email: string, dados: AlterarSenhaDto) {
    validarSenha(dados?.senhaAtual);
    validarSenha(dados?.novaSenha);
    if (Buffer.byteLength(dados.novaSenha, 'utf8') > 72) throw new BadRequestException('Senha deve ter no máximo 72 bytes');
    if (dados.senhaAtual === dados.novaSenha) throw new BadRequestException('Escolha uma senha diferente da temporária');
    const usuario = await this.repo.buscarPorEmail(email);
    if (!usuario?.senha || !await this.cripto.comparar(dados.senhaAtual, usuario.senha)) {
      throw new UnauthorizedException('Senha atual incorreta');
    }
    const hashNovo = await this.cripto.criptografar(dados.novaSenha);
    if (!await this.repo.alterarSenha(usuario.id!, usuario.senha, hashNovo)) {
      throw new UnauthorizedException('A senha foi alterada. Entre novamente.');
    }
    delete usuario.senha;
    return { ...usuario, trocarSenhaObrigatoria: false };
  }
}
