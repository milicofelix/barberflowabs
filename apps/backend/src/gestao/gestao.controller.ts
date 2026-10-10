import {
  BadRequestException,
  Body,
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
import { Usuario } from '@barbabrutal/core';
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
  AtualizarStatusLembreteDto,
  CriarLembreteRelacionamentoDto,
  CriarLancamentoFinanceiroDto,
  SalvarClienteDto,
} from './gestao.dto';
import { GestaoPrisma } from './gestao.prisma';
import { EquipePolicy } from 'src/equipe/equipe.policy';
import { PermissaoEquipe } from 'src/equipe/equipe.constants';

const STATUS_AGENDAMENTO = ['AGENDADO', 'CONFIRMADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW'];
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
  ) {}

  @Get('dashboard')
  async dashboard(@UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    return this.repo.dashboard(usuario.barbeariaId);
  }

  @Get('clientes')
  async listarClientes(@UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    return this.repo.listarClientes(usuario.barbeariaId);
  }

  @Post('clientes')
  async criarCliente(@Body() dados: SalvarClienteDto, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    this.validarCliente(dados, true);
    return this.repo.criarCliente(usuario.barbeariaId, {
      ...dados,
      senha: await this.cripto.criptografar(dados.senha!),
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
      cliente = await this.repo.atualizarCliente(Number(id), usuario.barbeariaId, {
        ...dados,
        senha: dados.senha ? await this.cripto.criptografar(dados.senha) : undefined,
      });
    } catch (error: any) {
      throw new ForbiddenException(error?.message ?? 'Cliente não pode ser alterado por esta barbearia');
    }

    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  @Get('clientes/:id/historico')
  async historicoCliente(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Cliente');
    const cliente = await this.repo.historicoCliente(Number(id), usuario.barbeariaId);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  @Delete('clientes/:id')
  async excluirCliente(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'EQUIPE_GERENCIAR');
    validarNumeroInteiroPositivo(id, 'Cliente');
    const cliente = await this.repo.excluirCliente(Number(id), usuario.barbeariaId);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
  }

  @Get('agendamentos')
  async listarAgendamentos(@Query('data') data: string, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'AGENDA_GERENCIAR');
    validarData(data);
    return this.repo.listarAgendamentos(usuario.barbeariaId, data);
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
      usuario.barbeariaId,
      dados.status,
    );
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado');
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
    return this.repo.listarFinanceiro(usuario.barbeariaId, inicio, fim);
  }

  @Post('financeiro')
  async criarLancamento(
    @Body() dados: CriarLancamentoFinanceiroDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'FINANCEIRO_VISUALIZAR');
    this.validarLancamento(dados);
    return this.repo.criarLancamento(usuario.barbeariaId, dados);
  }

  @Delete('financeiro/:id')
  async excluirLancamento(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'FINANCEIRO_VISUALIZAR');
    validarNumeroInteiroPositivo(id, 'Lançamento');
    const lancamento = await this.repo.excluirLancamento(Number(id), usuario.barbeariaId);
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
    return this.repo.relatorios(usuario.barbeariaId, inicio, fim);
  }

  @Get('relacionamento')
  async relacionamento(@UsuarioLogado() usuario: Usuario) {
    await this.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    return this.repo.relacionamento(usuario.barbeariaId);
  }

  @Post('relacionamento/lembretes')
  async criarLembrete(
    @Body() dados: CriarLembreteRelacionamentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    await this.validarPermissao(usuario, 'CONFIGURACOES_GERENCIAR');
    this.validarLembrete(dados);
    const lembrete = await this.repo.criarLembrete(usuario.barbeariaId, dados);
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
      usuario.barbeariaId,
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
