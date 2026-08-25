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
  CriarLancamentoFinanceiroDto,
  SalvarClienteDto,
} from './gestao.dto';
import { GestaoPrisma } from './gestao.prisma';

const STATUS_AGENDAMENTO = ['AGENDADO', 'CONFIRMADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW'];
const TIPOS_LANCAMENTO = ['RECEITA', 'DESPESA'];

@Controller('gestao')
export class GestaoController {
  constructor(
    private readonly repo: GestaoPrisma,
    private readonly cripto: BcryptProvider,
  ) {}

  @Get('dashboard')
  dashboard(@UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    return this.repo.dashboard(usuario.barbeariaId);
  }

  @Get('clientes')
  listarClientes(@UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    return this.repo.listarClientes(usuario.barbeariaId);
  }

  @Post('clientes')
  async criarCliente(@Body() dados: SalvarClienteDto, @UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
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
    this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Cliente');
    this.validarCliente(dados, false);

    const cliente = await this.repo.atualizarCliente(Number(id), usuario.barbeariaId, {
      ...dados,
      senha: dados.senha ? await this.cripto.criptografar(dados.senha) : undefined,
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  @Get('clientes/:id/historico')
  async historicoCliente(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Cliente');
    const cliente = await this.repo.historicoCliente(Number(id), usuario.barbeariaId);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return cliente;
  }

  @Delete('clientes/:id')
  async excluirCliente(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Cliente');
    const cliente = await this.repo.excluirCliente(Number(id), usuario.barbeariaId);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
  }

  @Get('agendamentos')
  listarAgendamentos(@Query('data') data: string, @UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    validarData(data);
    return this.repo.listarAgendamentos(usuario.barbeariaId, data);
  }

  @Put('agendamentos/:id/status')
  async atualizarStatus(
    @Param('id') id: string,
    @Body() dados: AtualizarStatusAgendamentoDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissao(usuario);
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
  listarFinanceiro(
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissao(usuario);
    validarData(inicio, 'Início');
    validarData(fim, 'Fim');
    return this.repo.listarFinanceiro(usuario.barbeariaId, inicio, fim);
  }

  @Post('financeiro')
  criarLancamento(
    @Body() dados: CriarLancamentoFinanceiroDto,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissao(usuario);
    this.validarLancamento(dados);
    return this.repo.criarLancamento(usuario.barbeariaId, dados);
  }

  @Delete('financeiro/:id')
  async excluirLancamento(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    this.validarPermissao(usuario);
    validarNumeroInteiroPositivo(id, 'Lançamento');
    const lancamento = await this.repo.excluirLancamento(Number(id), usuario.barbeariaId);
    if (!lancamento) throw new NotFoundException('Lançamento não encontrado');
  }

  @Get('relatorios')
  relatorios(
    @Query('inicio') inicio: string,
    @Query('fim') fim: string,
    @UsuarioLogado() usuario: Usuario,
  ) {
    this.validarPermissao(usuario);
    validarData(inicio, 'Início');
    validarData(fim, 'Fim');
    return this.repo.relatorios(usuario.barbeariaId, inicio, fim);
  }

  private validarPermissao(usuario: Usuario) {
    if (!usuario?.barbeiro) {
      throw new ForbiddenException('Apenas barbeiros podem acessar a gestão');
    }
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
  }
}
