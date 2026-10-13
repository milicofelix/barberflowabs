import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Usuario } from '@uniflowabs/core';
import { BcryptProvider } from 'src/auth/bcrypt.provider';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import {
  validarData,
  validarEmail,
  validarNumeroInteiroPositivo,
  validarSenha,
  validarTextoObrigatorio,
} from 'src/shared/validacao';
import {
  AtualizarStatusAgendamentoDto,
  ConsultarAgendaPeriodoDto,
  CriarAgendamentoAssistidoDto,
  AtualizarStatusLembreteDto,
  CriarLembreteRelacionamentoDto,
  CriarLancamentoFinanceiroDto,
  SalvarClienteDto,
} from './gestao.dto';
import { GestaoPrisma } from './gestao.prisma';
import { EquipePolicy } from 'src/equipe/equipe.policy';
import { PermissaoEquipe } from 'src/equipe/equipe.constants';
import { FinanceiroService } from 'src/financeiro/financeiro.service';
import { MotorAgendaService } from 'src/motor-agenda/motor-agenda.service';
import { ConflitoAgendaError } from 'src/motor-agenda/conflito-agenda.error';
import { AgendaOperacionalService } from './agenda-operacional.service';
import { randomUUID } from 'crypto';

const STATUS_AGENDAMENTO = ['AGENDADO', 'CONFIRMADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW'];
const ORIGENS_AGENDAMENTO_ASSISTIDO = ['RECEPCAO', 'TELEFONE', 'WHATSAPP', 'PRESENCIAL', 'OUTRO'];
const TIPOS_LANCAMENTO = ['RECEITA', 'DESPESA'];
const TIPOS_LEMBRETE = ['CONFIRMACAO', 'ANIVERSARIO', 'RETORNO', 'FIDELIDADE', 'CAMPANHA'];
const CANAIS_LEMBRETE = ['WHATSAPP', 'EMAIL', 'TELEFONE'];
const STATUS_LEMBRETE = ['PENDENTE', 'AGENDADO', 'ENVIADO', 'CANCELADO'];

@Controller('gestao')
export class GestaoController {
  constructor(
    private readonly repo: GestaoPrisma,
    private readonly cripto: BcryptProvider,
    private readonly equipePolicy: EquipePolicy,
    private readonly financeiro: FinanceiroService,
    private readonly motorAgenda: MotorAgendaService,
    private readonly agendaOperacional: AgendaOperacionalService,
  ) {}

  @Get('dashboard')
  async dashboard(@UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    return this.repo.dashboard(usuario.estabelecimentoId);
  }

  @Get('clientes')
  async listarClientes(@UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    return this.repo.listarClientes(usuario.estabelecimentoId);
  }

  @Post('clientes')
  async criarCliente(@Body() dados: SalvarClienteDto, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    this.validarCliente(dados, false);
    return this.repo.criarCliente(usuario.estabelecimentoId, {
      ...dados,
      senha: await this.cripto.criptografar(dados.senha || randomUUID()),
    });
  }

  @Put('clientes/:id')
  async atualizarCliente(
    @Param('id') id: string,
    @Body() dados: SalvarClienteDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Cliente');
    this.validarCliente(dados, false);

    let cliente: any;

    try {
      cliente = await this.repo.atualizarCliente(Number(id), usuario.estabelecimentoId, {
        ...dados,
        senha: dados.senha ? await this.cripto.criptografar(dados.senha) : undefined,
      });
    } catch (error: any) {
      throw new ForbiddenException(error?.message ?? 'Cliente não pode ser alterado por este estabelecimento');
    }

    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  @Get('clientes/:id/historico')
  async historicoCliente(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Cliente');
    const cliente = await this.repo.historicoCliente(Number(id), usuario.estabelecimentoId);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  @Delete('clientes/:id')
  async excluirCliente(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Cliente');
    const cliente = await this.repo.excluirCliente(Number(id), usuario.estabelecimentoId);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
  }

  @Get('agendamentos')
  async listarAgendamentos(@Query('data') data: string, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    validarData(data);
    return this.repo.listarAgendamentos(usuario.estabelecimentoId, data);
  }

  @Get('agenda')
  async consultarAgenda(
    @Query() consulta: ConsultarAgendaPeriodoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    return this.agendaOperacional.consultar(usuario.estabelecimentoId!, consulta);
  }

  @Get('agendamentos/futuros')
  async listarAgendamentosFuturos(@UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    return this.repo.listarAgendamentosFuturos(usuario.estabelecimentoId!);
  }

  @Get('agendamentos/clientes')
  async listarClientesParaAgendamento(@Query('busca') busca: string | undefined, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    return this.repo.listarClientesParaAgendamento(usuario.estabelecimentoId!, busca);
  }

  @Get('agendamentos/contexto')
  async contextoAgendamentoAssistido(@UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    return this.repo.contextoAgendamentoAssistido(usuario.estabelecimentoId!);
  }

  @Post('agendamentos')
  async criarAgendamentoAssistido(
    @Body() dados: CriarAgendamentoAssistidoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    validarNumeroInteiroPositivo(dados?.clienteId, 'Cliente');
    if (dados.origem && !ORIGENS_AGENDAMENTO_ASSISTIDO.includes(dados.origem)) {
      throw new BadRequestException('Origem do agendamento inválida');
    }
    const cliente = await this.repo.obterClienteParaAgendamento(usuario.estabelecimentoId!, Number(dados.clienteId));
    if (!cliente) throw new NotFoundException('Cliente não está vinculado a este estabelecimento');
    try {
      return await this.motorAgenda.criar(usuario.estabelecimentoId!, {
        ...dados,
        usuario: { id: cliente.id },
      }, cliente, {
        criadoPorId: usuario.id!,
        origem: dados.origem ?? 'RECEPCAO',
        observacoes: dados.observacoes,
      });
    } catch (error: any) {
      if (error instanceof ConflictException) throw error;
      if (error instanceof ConflitoAgendaError) throw new ConflictException(error.message);
      throw new BadRequestException(error?.message ?? 'Não foi possível criar o agendamento assistido');
    }
  }

  @Put('agendamentos/:id/status')
  async atualizarStatus(
    @Param('id') id: string,
    @Body() dados: AtualizarStatusAgendamentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Agendamento');
    if (!STATUS_AGENDAMENTO.includes(dados?.status)) {
      throw new BadRequestException('Status inválido');
    }

    const agendamento = await this.repo.atualizarStatusAgendamento(
      Number(id),
      usuario.estabelecimentoId,
      dados.status,
    );
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado');
    if (dados.status === 'CONCLUIDO') {
      await this.financeiro.registrarReceitaAgendamento(usuario.estabelecimentoId!, usuario.id!, agendamento);
    }
    return agendamento;
  }

  @Get('financeiro')
  async listarFinanceiro(
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'FINANCEIRO_VISUALIZAR');
    validarData(inicio, 'Início');
    validarData(fim, 'Fim');
    return this.repo.listarFinanceiro(usuario.estabelecimentoId, inicio, fim);
  }

  @Post('financeiro')
  async criarLancamento(
    @Body() dados: CriarLancamentoFinanceiroDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'FINANCEIRO_GERENCIAR');
    this.validarLancamento(dados);
    return this.repo.criarLancamento(usuario.estabelecimentoId, dados);
  }

  @Delete('financeiro/:id')
  async excluirLancamento(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'FINANCEIRO_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Lançamento');
    const lancamento = await this.repo.excluirLancamento(Number(id), usuario.estabelecimentoId);
    if (!lancamento) throw new NotFoundException('Lançamento não encontrado');
  }

  @Get('relatorios')
  async relatorios(
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'FINANCEIRO_VISUALIZAR');
    validarData(inicio, 'Início');
    validarData(fim, 'Fim');
    return this.repo.relatorios(usuario.estabelecimentoId, inicio, fim);
  }

  @Get('relacionamento')
  async relacionamento(@UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    return this.repo.relacionamento(usuario.estabelecimentoId);
  }

  @Post('relacionamento/lembretes')
  async criarLembrete(
    @Body() dados: CriarLembreteRelacionamentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    this.validarLembrete(dados);
    const lembrete = await this.repo.criarLembrete(usuario.estabelecimentoId, dados);
    if (!lembrete) throw new NotFoundException('Cliente ou agendamento não encontrado');
    return lembrete;
  }

  @Put('relacionamento/lembretes/:id/status')
  async atualizarStatusLembrete(
    @Param('id') id: string,
    @Body() dados: AtualizarStatusLembreteDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Lembrete');
    if (!STATUS_LEMBRETE.includes(dados?.status)) {
      throw new BadRequestException('Status do lembrete inválido');
    }

    const lembrete = await this.repo.atualizarStatusLembrete(
      Number(id),
      usuario.estabelecimentoId,
      dados.status,
    );
    if (!lembrete) throw new NotFoundException('Lembrete não encontrado');
    return lembrete;
  }

  private validarPermissao(usuario: Usuario, permissao: PermissaoEquipe) {
    return this.equipePolicy.validarPermissao(usuario, permissao);
  }

  private validarLancamento(dados: CriarLancamentoFinanceiroDto) {
    if (!TIPOS_LANCAMENTO.includes(dados?.tipo)) {
      throw new BadRequestException('Tipo de lançamento inválido');
    }

    validarTextoObrigatorio(dados.descricao, 'Descrição');
    validarData(dados.data);

    if (!Number.isFinite(Number(dados.valor)) || Number(dados.valor) <= 0) {
      throw new BadRequestException('Valor inválido');
    }

    if (dados.profissionalId) {
      validarNumeroInteiroPositivo(dados.profissionalId, 'Profissional');
    }

    if (dados.usuarioId) {
      validarNumeroInteiroPositivo(dados.usuarioId, 'Cliente');
    }
  }

  private validarCliente(dados: SalvarClienteDto, exigirSenha: boolean) {
    validarTextoObrigatorio(dados?.nome, 'Nome');
    validarEmail(dados?.email);

    if (exigirSenha || dados?.senha) {
      validarSenha(dados.senha);
    }

    if (dados?.dataNascimento) {
      validarData(dados.dataNascimento, 'Data de nascimento');
    }
  }

  private validarLembrete(dados: CriarLembreteRelacionamentoDto) {
    if (!TIPOS_LEMBRETE.includes(dados?.tipo)) {
      throw new BadRequestException('Tipo de lembrete inválido');
    }

    if (dados?.canal && !CANAIS_LEMBRETE.includes(dados.canal)) {
      throw new BadRequestException('Canal do lembrete inválido');
    }

    validarTextoObrigatorio(dados?.mensagem, 'Mensagem');
    validarData(dados?.dataPrevista, 'Data prevista');

    if (dados?.usuarioId) {
      validarNumeroInteiroPositivo(dados.usuarioId, 'Cliente');
    }

    if (dados?.agendamentoId) {
      validarNumeroInteiroPositivo(dados.agendamentoId, 'Agendamento');
    }
  }
}
