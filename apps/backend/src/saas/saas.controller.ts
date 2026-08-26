import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Usuario } from '@barbabrutal/core';
import { BcryptProvider } from 'src/auth/bcrypt.provider';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import {
  validarEmail,
  validarNumeroInteiroPositivo,
  validarSenha,
  validarTextoObrigatorio,
} from 'src/shared/validacao';
import { AtualizarPlanoDto, AtualizarStatusBarbeariaDto, OnboardingSaasDto } from './saas.dto';
import { SaasPrisma } from './saas.prisma';

const STATUS_BARBEARIA = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED'];

@Controller('saas')
export class SaasController {
  constructor(
    private readonly repo: SaasPrisma,
    private readonly cripto: BcryptProvider,
  ) {}

  @Get('planos')
  listarPlanos() {
    return this.repo.listarPlanos();
  }

  @Post('onboarding')
  async onboarding(@Body() dados: OnboardingSaasDto) {
    this.validarOnboarding(dados);
    return this.repo.onboarding({
      ...dados,
      dono: {
        ...dados.dono,
        senha: await this.cripto.criptografar(dados.dono.senha),
      },
    });
  }

  @Get('billing')
  async billing(@UsuarioLogado() usuario: Usuario) {
    this.validarBarbeiro(usuario);
    const billing = await this.repo.billing(usuario.barbeariaId!);
    if (!billing) throw new NotFoundException('Barbearia não encontrada');
    return billing;
  }

  @Put('billing/plano')
  atualizarPlano(@Body() dados: AtualizarPlanoDto, @UsuarioLogado() usuario: Usuario) {
    this.validarBarbeiro(usuario);
    validarTextoObrigatorio(dados.planoSlug, 'Plano');
    return this.repo.atualizarPlano(usuario.barbeariaId!, dados.planoSlug, usuario.id!);
  }

  @Get('admin/barbearias')
  listarBarbeariasAdmin(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.repo.listarBarbeariasAdmin();
  }

  @Get('admin/me')
  diagnosticoAdmin(@UsuarioLogado() usuario: Usuario) {
    const emailsSuperAdmin = this.emailsSuperAdmin();
    const emailNormalizado = usuario?.email?.trim().toLowerCase();

    return {
      id: usuario?.id,
      nome: usuario?.nome,
      email: usuario?.email,
      barbeiro: usuario?.barbeiro ?? false,
      papel: usuario?.papel,
      role: usuario?.role,
      superAdminPorBanco:
        usuario?.papel === 'SUPER_ADMIN' || usuario?.role === 'SUPER_ADMIN',
      superAdminPorEnv: !!emailNormalizado && emailsSuperAdmin.includes(emailNormalizado),
      superAdmin: this.ehSuperAdmin(usuario),
      superAdminEmailsConfigurado: emailsSuperAdmin.length > 0,
    };
  }

  @Put('admin/barbearias/:id/status')
  atualizarStatusBarbearia(
    @Param('id') id: string,
    @Body() dados: AtualizarStatusBarbeariaDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Barbearia');

    if (!STATUS_BARBEARIA.includes(dados?.status)) {
      throw new BadRequestException('Status inválido');
    }

    return this.repo.atualizarStatusBarbearia(Number(id), dados.status, usuario.id!);
  }

  @Get('admin/auditoria')
  listarAuditoriaAdmin(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.repo.listarAuditoriaAdmin();
  }

  private validarOnboarding(dados: OnboardingSaasDto) {
    validarTextoObrigatorio(dados?.barbearia?.nome, 'Nome da barbearia');
    validarTextoObrigatorio(dados?.barbearia?.slug, 'Slug da barbearia');
    validarTextoObrigatorio(dados?.dono?.nome, 'Nome do responsável');
    validarEmail(dados?.dono?.email);
    validarSenha(dados?.dono?.senha);

    if (dados.barbearia.email) {
      validarEmail(dados.barbearia.email, 'E-mail da barbearia');
    }
  }

  private validarBarbeiro(usuario: Usuario) {
    if (!usuario?.barbeiro && !this.ehSuperAdmin(usuario)) {
      throw new ForbiddenException('Apenas responsáveis pela barbearia podem acessar billing');
    }
  }

  private validarSuperAdmin(usuario: Usuario) {
    if (!this.ehSuperAdmin(usuario)) {
      throw new ForbiddenException('Apenas super administradores podem acessar esta área');
    }
  }

  private ehSuperAdmin(usuario: Usuario) {
    const emailNormalizado = usuario?.email?.trim().toLowerCase();

    return (
      usuario?.role === 'SUPER_ADMIN' ||
      usuario?.papel === 'SUPER_ADMIN' ||
      (!!emailNormalizado && this.emailsSuperAdmin().includes(emailNormalizado))
    );
  }

  private emailsSuperAdmin() {
    return (process.env.SUPER_ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }
}
