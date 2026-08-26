import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { LoginUsuario, RegistrarUsuario, Usuario } from '@barbabrutal/core';
import { UsuarioPrisma } from './usuario.prisma';
import { BcryptProvider } from './bcrypt.provider';
import * as jwt from 'jsonwebtoken';
import { TenantService } from 'src/shared/tenant.service';
import { validarEmail, validarSenha, validarTextoObrigatorio } from 'src/shared/validacao';
import {
  AuthTokenPayload,
  LoginDto,
  RefreshTokenDto,
  RegistrarUsuarioDto,
} from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly repo: UsuarioPrisma,
    private readonly cripto: BcryptProvider,
    private readonly tenant: TenantService,
  ) {}

  @Post('registrar')
  async registrar(@Body() usuario: RegistrarUsuarioDto, @Req() req: any) {
    this.validarRegistro(usuario);

    const barbeariaId = await this.tenant.resolverBarbeariaId(req);
    const casoDeUso = new RegistrarUsuario(this.repo, this.cripto);
    await casoDeUso.executar({ ...usuario, barbeariaId });
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
      barbeariaId: superAdmin ? null : usuario.barbeariaId!,
      barbeiro: superAdmin ? false : usuario.barbeiro ?? false,
      papel,
      role: papel,
      telefone: usuario.telefone,
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

    return (usuario.papel ?? (usuario.barbeiro ? 'BARBER' : 'CUSTOMER')) as AuthTokenPayload['role'];
  }
}
