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
  validarNumeroInteiroNaoNegativo,
  validarNumeroInteiroPositivo,
  validarSenha,
  validarTextoObrigatorio,
} from 'src/shared/validacao';
import {
  AtualizarPlanoAdminDto,
  AtualizarPlanoDto,
  AtualizarComercialBarbeariaDto,
  AtualizarDestaqueBarbeariaDto,
  AtualizarStatusBarbeariaDto,
  OnboardingSaasDto,
  RevisarBarbeariaDto,
} from './saas.dto';
import { SaasPrisma } from './saas.prisma';

const STATUS_BARBEARIA = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED'];
const STATUS_COMERCIAL = ['NOVO', 'EM_CONTATO', 'APROVADO', 'RECUSADO', 'CONVERTIDO'];

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
  async billingLegado(@UsuarioLogado() usuario: Usuario) {
    return this.buscarCobranca(usuario);
  }

  @Get('cobranca')
  async cobranca(@UsuarioLogado() usuario: Usuario) {
    return this.buscarCobranca(usuario);
  }

  private async buscarCobranca(usuario: Usuario) {
    this.validarBarbeiro(usuario);
    const billing = await this.repo.billing(usuario.barbeariaId!);
    if (!billing) throw new NotFoundException('Barbearia não encontrada');
    return billing;
  }

  @Put('billing/plano')
  atualizarPlanoLegado(@Body() dados: AtualizarPlanoDto, @UsuarioLogado() usuario: Usuario) {
    return this.atualizarPlanoCobranca(dados, usuario);
  }

  @Put('cobranca/plano')
  atualizarPlano(@Body() dados: AtualizarPlanoDto, @UsuarioLogado() usuario: Usuario) {
    return this.atualizarPlanoCobranca(dados, usuario);
  }

  private atualizarPlanoCobranca(dados: AtualizarPlanoDto, usuario: Usuario) {
    this.validarBarbeiro(usuario);
    validarTextoObrigatorio(dados.planoSlug, 'Plano');
    return this.repo.atualizarPlano(usuario.barbeariaId!, dados.planoSlug, usuario.id!);
  }

  @Get('admin/barbearias')
  listarBarbeariasAdmin(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.repo.listarBarbeariasAdmin();
  }

  @Get('admin/barbearias/pendentes')
  listarBarbeariasPendentesAdmin(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.repo.listarBarbeariasPendentesAdmin();
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

  @Get('admin/planos')
  listarPlanosAdmin(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.repo.listarPlanosAdmin();
  }

  @Put('admin/planos/:id')
  atualizarPlanoAdmin(
    @Param('id') id: string,
    @Body() dados: AtualizarPlanoAdminDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Plano');
    this.validarPlanoAdmin(dados);
    return this.repo.atualizarPlanoAdmin(Number(id), usuario.id!, dados);
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

  @Put('admin/barbearias/:id/destaque')
  atualizarDestaqueBarbearia(
    @Param('id') id: string,
    @Body() dados: AtualizarDestaqueBarbeariaDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Barbearia');

    if (typeof dados?.destaque !== 'boolean') {
      throw new BadRequestException('Destaque deve ser verdadeiro ou falso');
    }

    return this.repo.atualizarDestaqueBarbearia(Number(id), dados.destaque, usuario.id!);
  }

  @Put('admin/barbearias/:id/comercial')
  atualizarComercialBarbearia(
    @Param('id') id: string,
    @Body() dados: AtualizarComercialBarbeariaDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Barbearia');

    if (!STATUS_COMERCIAL.includes(dados?.comercialStatus)) {
      throw new BadRequestException('Status comercial inválido');
    }

    const ultimoContatoEm = this.dataOpcional(dados.ultimoContatoEm, 'Último contato');
    const proximoContatoEm = this.dataOpcional(dados.proximoContatoEm, 'Próximo contato');
    return this.repo.atualizarComercialBarbearia(Number(id), usuario.id!, {
      comercialStatus: dados.comercialStatus,
      notasInternas: dados.notasInternas,
      ultimoContatoEm,
      proximoContatoEm,
    });
  }

  @Put('admin/barbearias/:id/aprovar')
  aprovarBarbearia(
    @Param('id') id: string,
    @Body() dados: RevisarBarbeariaDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Barbearia');
    return this.repo.aprovarBarbearia(Number(id), usuario.id!, dados?.motivo);
  }

  @Put('admin/barbearias/:id/reprovar')
  reprovarBarbearia(
    @Param('id') id: string,
    @Body() dados: RevisarBarbeariaDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Barbearia');
    validarTextoObrigatorio(dados?.motivo, 'Motivo');
    return this.repo.reprovarBarbearia(Number(id), usuario.id!, dados.motivo!);
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

  private validarPlanoAdmin(dados: AtualizarPlanoAdminDto) {
    if (dados.nome !== undefined) validarTextoObrigatorio(dados.nome, 'Nome do plano');
    if (dados.descricao !== undefined) validarTextoObrigatorio(dados.descricao, 'Descrição do plano');

    if (dados.precoMensal !== undefined) {
      const preco = Number(dados.precoMensal);
      if (!Number.isFinite(preco) || preco < 0) {
        throw new BadRequestException('Preço mensal inválido');
      }
    }

    if (dados.limiteUsuarios !== undefined) validarNumeroInteiroNaoNegativo(dados.limiteUsuarios, 'Limite de usuários');
    if (dados.limiteUnidades !== undefined) validarNumeroInteiroNaoNegativo(dados.limiteUnidades, 'Limite de unidades');
    if (dados.limiteServicos !== undefined) validarNumeroInteiroNaoNegativo(dados.limiteServicos, 'Limite de serviços');

    if (dados.ativo !== undefined && typeof dados.ativo !== 'boolean') {
      throw new BadRequestException('Ativo deve ser verdadeiro ou falso');
    }
  }

  private validarBarbeiro(usuario: Usuario) {
    if (!usuario?.barbeiro || this.ehSuperAdmin(usuario)) {
      throw new ForbiddenException('Apenas responsáveis pela barbearia podem acessar cobrança');
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

  private dataOpcional(valor: string | null | undefined, campo: string) {
    if (!valor) return null;
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
      throw new BadRequestException(`${campo} inválido`);
    }

    return data;
  }
}
