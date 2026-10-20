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
import { Usuario } from '@uniflowabs/core';
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
  AtualizarComercialEstabelecimentoDto,
  AtualizarDestaqueEstabelecimentoDto,
  AtualizarStatusEstabelecimentoDto,
  OnboardingSaasDto,
  RevisarDenunciaPerfilDto,
  RevisarEstabelecimentoDto,
} from './saas.dto';
import { SaasPrisma } from './saas.prisma';
import { MODELOS_ATENDIMENTO, TIPOS_ESTABELECIMENTO } from 'src/estabelecimento/estabelecimento.constants';
import { FinanceiroService } from 'src/financeiro/financeiro.service';
import { GeocodificacaoEnderecoService } from 'src/geocodificacao/geocodificacao-endereco.service';

const STATUS_ESTABELECIMENTO = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED'];
const STATUS_COMERCIAL = ['NOVO', 'EM_CONTATO', 'APROVADO', 'RECUSADO', 'CONVERTIDO'];
const STATUS_DENUNCIA = ['PENDENTE', 'EM_ANALISE', 'RESOLVIDA', 'DESCARTADA'];

@Controller('saas')
export class SaasController {
  constructor(
    private readonly repo: SaasPrisma,
    private readonly cripto: BcryptProvider,
    private readonly financeiro: FinanceiroService,
    private readonly geocodificacao: GeocodificacaoEnderecoService,
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
    this.validarMembroEstabelecimento(usuario);
    const billing = await this.repo.billing(usuario.estabelecimentoId!);
    if (!billing) throw new NotFoundException('Estabelecimento não encontrado');
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
    this.validarMembroEstabelecimento(usuario);
    validarTextoObrigatorio(dados.planoSlug, 'Plano');
    return this.repo.atualizarPlano(usuario.estabelecimentoId!, dados.planoSlug, usuario.id!);
  }

  @Get('admin/estabelecimentos')
  listarEstabelecimentosAdmin(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.repo.listarEstabelecimentosAdmin();
  }

  @Get('admin/estabelecimentos/pendentes')
  listarEstabelecimentosPendentesAdmin(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.repo.listarEstabelecimentosPendentesAdmin();
  }

  @Get('admin/me')
  diagnosticoAdmin(@UsuarioLogado() usuario: Usuario) {
    const emailsSuperAdmin = this.emailsSuperAdmin();
    const emailNormalizado = usuario?.email?.trim().toLowerCase();

    return {
      id: usuario?.id,
      nome: usuario?.nome,
      email: usuario?.email,
      membroEstabelecimento: usuario?.membroEstabelecimento ?? false,
      papel: usuario?.papel,
      role: usuario?.role,
      superAdminPorBanco:
        ['SUPER_ADMIN', 'APP_OWNER'].includes(String(usuario?.papel ?? usuario?.role ?? '').toUpperCase()),
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

  @Put('admin/estabelecimentos/:id/status')
  atualizarStatusEstabelecimento(
    @Param('id') id: string,
    @Body() dados: AtualizarStatusEstabelecimentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Estabelecimento');

    if (!STATUS_ESTABELECIMENTO.includes(dados?.status)) {
      throw new BadRequestException('Status inválido');
    }

    return this.repo.atualizarStatusEstabelecimento(Number(id), dados.status, usuario.id!);
  }

  @Put('admin/estabelecimentos/:id/destaque')
  atualizarDestaqueEstabelecimento(
    @Param('id') id: string,
    @Body() dados: AtualizarDestaqueEstabelecimentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Estabelecimento');

    if (typeof dados?.destaque !== 'boolean') {
      throw new BadRequestException('Destaque deve ser verdadeiro ou falso');
    }

    return this.repo.atualizarDestaqueEstabelecimento(Number(id), dados.destaque, usuario.id!);
  }

  @Put('admin/estabelecimentos/:id/comercial')
  atualizarComercialEstabelecimento(
    @Param('id') id: string,
    @Body() dados: AtualizarComercialEstabelecimentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Estabelecimento');

    if (!STATUS_COMERCIAL.includes(dados?.comercialStatus)) {
      throw new BadRequestException('Status comercial inválido');
    }

    const ultimoContatoEm = this.dataOpcional(dados.ultimoContatoEm, 'Último contato');
    const proximoContatoEm = this.dataOpcional(dados.proximoContatoEm, 'Próximo contato');
    return this.repo.atualizarComercialEstabelecimento(Number(id), usuario.id!, {
      comercialStatus: dados.comercialStatus,
      notasInternas: dados.notasInternas,
      ultimoContatoEm,
      proximoContatoEm,
    });
  }

  @Put('admin/estabelecimentos/:id/aprovar')
  aprovarEstabelecimento(
    @Param('id') id: string,
    @Body() dados: RevisarEstabelecimentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Estabelecimento');
    return this.repo.aprovarEstabelecimento(Number(id), usuario.id!, dados?.motivo);
  }

  @Put('admin/estabelecimentos/:id/reprovar')
  reprovarEstabelecimento(
    @Param('id') id: string,
    @Body() dados: RevisarEstabelecimentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Estabelecimento');
    validarTextoObrigatorio(dados?.motivo, 'Motivo');
    return this.repo.reprovarEstabelecimento(Number(id), usuario.id!, dados.motivo!);
  }

  @Put('admin/estabelecimentos/:id/coordenadas')
  atualizarCoordenadas(
    @Param('id') id: string,
    @Body() dados: { latitude: number | string; longitude: number | string },
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Estabelecimento');
    const latitude = this.validarCoordenada(dados?.latitude, -90, 90, 'Latitude');
    const longitude = this.validarCoordenada(dados?.longitude, -180, 180, 'Longitude');
    return this.repo.atualizarCoordenadasEstabelecimento(Number(id), usuario.id!, latitude, longitude);
  }

  @Post('admin/estabelecimentos/:id/resolver-coordenadas')
  async resolverCoordenadasEstabelecimento(
    @Param('id') id: string,
    @Body() dados: { googleMapsUrl?: string | null },
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Estabelecimento');
    const estabelecimento = await this.repo.buscarEnderecoEstabelecimento(Number(id));
    if (!estabelecimento) throw new NotFoundException('Estabelecimento não encontrado');
    const coordenadas = await this.geocodificacao.resolver(estabelecimento, dados?.googleMapsUrl);
    await this.repo.atualizarCoordenadasEstabelecimento(
      Number(id), usuario.id!, coordenadas.latitude, coordenadas.longitude,
    );
    return coordenadas;
  }

  @Get('admin/auditoria')
  listarAuditoriaAdmin(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.repo.listarAuditoriaAdmin();
  }

  @Post('admin/inadimplencia/processar')
  processarInadimplencia(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.financeiro.processarInadimplencia(usuario.id!);
  }

  @Get('admin/notificacoes')
  listarNotificacoesAdmin(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.repo.listarNotificacoesAdmin();
  }

  @Get('admin/denuncias-perfil')
  listarDenunciasPerfil(@UsuarioLogado() usuario: Usuario) {
    this.validarSuperAdmin(usuario);
    return this.repo.listarDenunciasPerfilAdmin();
  }

  @Put('admin/denuncias-perfil/:id')
  revisarDenunciaPerfil(
    @Param('id') id: string,
    @Body() dados: RevisarDenunciaPerfilDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarSuperAdmin(usuario);
    validarNumeroInteiroPositivo(id, 'Denúncia');

    if (!STATUS_DENUNCIA.includes(dados?.status)) {
      throw new BadRequestException('Status da denúncia inválido');
    }

    return this.repo.revisarDenunciaPerfilAdmin(Number(id), usuario.id!, dados);
  }

  private validarOnboarding(dados: OnboardingSaasDto) {
    validarTextoObrigatorio(dados?.estabelecimento?.nome, 'Nome do estabelecimento');
    validarTextoObrigatorio(dados?.estabelecimento?.slug, 'Slug do estabelecimento');
    validarTextoObrigatorio(dados?.dono?.nome, 'Nome do responsável');
    validarEmail(dados?.dono?.email);
    validarSenha(dados?.dono?.senha);

    if (dados.estabelecimento.email) {
      validarEmail(dados.estabelecimento.email, 'E-mail do estabelecimento');
    }
    if (!TIPOS_ESTABELECIMENTO.includes(dados?.estabelecimento?.tipoEstabelecimento as any)) {
      throw new BadRequestException('Tipo de estabelecimento inválido');
    }
    if (!MODELOS_ATENDIMENTO.includes(dados?.estabelecimento?.modeloAtendimento as any)) {
      throw new BadRequestException('Modelo de atendimento inválido');
    }
    this.validarIdsOnboarding(dados?.estabelecimento?.segmentoIds, 'Segmentos');
    this.validarIdsOnboarding(dados?.estabelecimento?.especialidadeIds, 'Especialidades');
  }

  private validarIdsOnboarding(ids: number[], campo: string) {
    if (!Array.isArray(ids) || !ids.length || ids.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
      throw new BadRequestException(`${campo} inválidos`);
    }
    if (new Set(ids.map(Number)).size !== ids.length) throw new BadRequestException(`${campo} repetidos`);
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

  private validarMembroEstabelecimento(usuario: Usuario) {
    if (!usuario?.membroEstabelecimento || this.ehSuperAdmin(usuario)) {
      throw new ForbiddenException('Apenas responsáveis pelo estabelecimento podem acessar cobrança');
    }
  }

  private validarSuperAdmin(usuario: Usuario) {
    if (!this.ehSuperAdmin(usuario)) {
      throw new ForbiddenException('Apenas super administradores podem acessar esta área');
    }
  }

  private ehSuperAdmin(usuario: Usuario) {
    const emailNormalizado = usuario?.email?.trim().toLowerCase();
    const papel = String(usuario?.papel ?? usuario?.role ?? '').toUpperCase();

    return (
      papel === 'SUPER_ADMIN' ||
      papel === 'APP_OWNER' ||
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

  private validarCoordenada(valor: unknown, minimo: number, maximo: number, campo: string) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < minimo || numero > maximo) throw new BadRequestException(`${campo} inválida`);
    return numero;
  }
}
