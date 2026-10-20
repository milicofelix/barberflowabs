import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { LoginUsuario, RegistrarUsuario, Usuario } from '@uniflowabs/core';
import { UsuarioPrisma } from './usuario.prisma';
import { BcryptProvider } from './bcrypt.provider';
import { AlterarSenhaService } from './alterar-senha.service';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import * as jwt from 'jsonwebtoken';
import { validarEmail, validarSenha, validarTextoObrigatorio } from 'src/shared/validacao';
import {
  AuthTokenPayload,
  AlterarSenhaDto,
  LoginDto,
  RefreshTokenDto,
  RegistrarUsuarioDto,
} from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly repo: UsuarioPrisma,
    private readonly cripto: BcryptProvider,
    private readonly alterarSenhaService: AlterarSenhaService,
  ) {}

  @Post('registrar')
  async registrar(@Body() usuario: RegistrarUsuarioDto) {
    this.validarRegistro(usuario);

    const casoDeUso = new RegistrarUsuario(this.repo, this.cripto);
    await casoDeUso.executar({ ...usuario, estabelecimentoId: undefined, papel: 'CUSTOMER' });
  }

  @Post('login')
  async login(@Body() dados: LoginDto) {
    this.validarLogin(dados);

    const casoDeUso = new LoginUsuario(this.repo, this.cripto);
    const usuario = await casoDeUso.executar({
      email: dados.email,
      senha: dados.senha,
    });

    const segredo = process.env.JWT_SECRET;
    return jwt.sign(this.criarPayloadToken(usuario), segredo, { expiresIn: '15d' });
  }

  @Post('refresh')
  async refresh(@Body() dados: RefreshTokenDto) {
    validarTextoObrigatorio(dados.token, 'Token');

    let payload: AuthTokenPayload;
    try {
      payload = jwt.verify(
        dados.token,
        process.env.JWT_SECRET!,
      ) as unknown as AuthTokenPayload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }

    if (!payload?.email) {
      throw new UnauthorizedException('Token inválido');
    }

    const usuario = await this.repo.buscarPorEmail(payload.email);
    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (payload.trocarSenhaObrigatoria && !usuario.trocarSenhaObrigatoria) {
      throw new UnauthorizedException('A senha temporária já foi substituída. Entre novamente.');
    }

    delete usuario.senha;
    return jwt.sign(this.criarPayloadToken(usuario), process.env.JWT_SECRET!, {
      expiresIn: '15d',
    });
  }

  private validarRegistro(usuario: RegistrarUsuarioDto) {
    validarTextoObrigatorio(usuario.nome, 'Nome');
    validarEmail(usuario.email);
    validarSenha(usuario.senha);
  }

  @Post('alterar-senha')
  async alterarSenha(@Body() dados: AlterarSenhaDto, @UsuarioLogado() usuario: Usuario) {
    const atualizado = await this.alterarSenhaService.executar(usuario.email, dados);
    return jwt.sign(this.criarPayloadToken(atualizado), process.env.JWT_SECRET!, { expiresIn: '15d' });
  }

  private validarLogin(dados: LoginDto) {
    validarEmail(dados.email);
    validarSenha(dados.senha);
  }

  private criarPayloadToken(usuario: Usuario): AuthTokenPayload {
    const papel = this.resolverPapel(usuario);
    const superAdmin = papel === 'SUPER_ADMIN';

    return {
      sub: usuario.id!,
      id: usuario.id!,
      nome: usuario.nome,
      email: usuario.email,
      estabelecimentoId: superAdmin ? null : usuario.estabelecimentoId!,
      membroEstabelecimento: superAdmin ? false : usuario.membroEstabelecimento ?? false,
      papel,
      role: papel,
      telefone: usuario.telefone,
      fotoURL: usuario.fotoURL,
      trocarSenhaObrigatoria: usuario.trocarSenhaObrigatoria ?? false,
    };
  }

  private resolverPapel(usuario: Usuario): AuthTokenPayload['role'] {
    const emailsSuperAdmin = (process.env.SUPER_ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (emailsSuperAdmin.includes(usuario.email.toLowerCase())) {
      return 'SUPER_ADMIN';
    }

    return (usuario.papel ?? (usuario.membroEstabelecimento ? 'ESTABLISHMENT_MEMBER' : 'CUSTOMER')) as AuthTokenPayload['role'];
  }
}
