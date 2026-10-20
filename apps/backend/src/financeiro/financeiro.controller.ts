import { BadRequestException, Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { Usuario } from '@uniflowabs/core';
import { EquipePolicy } from 'src/equipe/equipe.policy';
import { validarData, validarNumeroInteiroNaoNegativo, validarNumeroInteiroPositivo, validarTextoObrigatorio } from 'src/shared/validacao';
import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { STATUS_CONTA, TIPOS_CONTA, TIPOS_FORMA_PAGAMENTO } from './financeiro.constants';
import {
  AbrirCaixaDto,
  BaixarContaDto,
  CalcularRepassesDto,
  ConciliarDto,
  CriarContaDto,
  FecharCaixaDto,
  SalvarComissaoDto,
  SalvarFormaPagamentoDto,
} from './financeiro.dto';
import { FinanceiroService } from './financeiro.service';

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly service: FinanceiroService, private readonly policy: EquipePolicy) {}

  @Get('resumo')
  async resumo(@Query('inicio') inicio: string, @Query('fim') fim: string, @UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario); this.validarPeriodo(inicio, fim);
    return this.service.resumo(usuario.estabelecimentoId!, inicio, fim);
  }

  @Get('comissoes')
  async comissoes(@UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario);
    return this.service.listarComissoes(usuario.estabelecimentoId!);
  }

  @Put('comissoes')
  async salvarComissao(@Body() dados: SalvarComissaoDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); this.validarPercentual(dados?.percentual, 'Comissão');
    return this.service.salvarComissao(usuario.estabelecimentoId!, usuario.id!, dados);
  }

  @Get('formas-pagamento')
  async formasPagamento(@UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario);
    return this.service.listarFormasPagamento(usuario.estabelecimentoId!);
  }

  @Post('formas-pagamento')
  async criarFormaPagamento(@Body() dados: SalvarFormaPagamentoDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); this.validarFormaPagamento(dados);
    return this.service.salvarFormaPagamento(usuario.estabelecimentoId!, usuario.id!, dados);
  }

  @Put('formas-pagamento/:id')
  async atualizarFormaPagamento(@Param('id') id: string, @Body() dados: SalvarFormaPagamentoDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); validarNumeroInteiroPositivo(id, 'Forma de pagamento'); this.validarFormaPagamento(dados);
    return this.service.salvarFormaPagamento(usuario.estabelecimentoId!, usuario.id!, dados, Number(id));
  }

  @Get('contas')
  async contas(@Query() query: any, @UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario); this.validarPeriodo(query.inicio, query.fim);
    if (query.tipo && !TIPOS_CONTA.includes(query.tipo)) throw new BadRequestException('Tipo de conta inválido');
    if (query.status && ![...STATUS_CONTA, 'ATRASADO'].includes(query.status)) throw new BadRequestException('Status de conta inválido');
    return this.service.listarContas(usuario.estabelecimentoId!, query);
  }

  @Post('contas')
  async criarConta(@Body() dados: CriarContaDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); this.validarConta(dados);
    return this.service.criarConta(usuario.estabelecimentoId!, usuario.id!, dados);
  }

  @Put('contas/:id/baixar')
  async baixarConta(@Param('id') id: string, @Body() dados: BaixarContaDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); validarNumeroInteiroPositivo(id, 'Conta'); this.validarValor(dados?.valorPago, 'Valor pago'); validarData(dados?.pagoEm, 'Data do pagamento');
    return this.service.baixarConta(Number(id), usuario.estabelecimentoId!, usuario.id!, dados);
  }

  @Put('contas/:id/cancelar')
  async cancelarConta(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); validarNumeroInteiroPositivo(id, 'Conta');
    return this.service.cancelarConta(Number(id), usuario.estabelecimentoId!, usuario.id!);
  }

  @Get('caixas')
  async caixas(@UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario);
    return this.service.listarCaixas(usuario.estabelecimentoId!);
  }

  @Post('caixas/abrir')
  async abrirCaixa(@Body() dados: AbrirCaixaDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); this.validarValor(dados?.saldoInicial ?? 0, 'Saldo inicial', true);
    return this.service.abrirCaixa(usuario.estabelecimentoId!, usuario.id!, dados);
  }

  @Post('caixas/:id/fechar')
  async fecharCaixa(@Param('id') id: string, @Body() dados: FecharCaixaDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); validarNumeroInteiroPositivo(id, 'Caixa'); this.validarValor(dados?.saldoInformado, 'Saldo informado', true);
    return this.service.fecharCaixa(Number(id), usuario.estabelecimentoId!, usuario.id!, dados);
  }

  @Get('repasses')
  async repasses(@Query('inicio') inicio: string, @Query('fim') fim: string, @UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario); this.validarPeriodo(inicio, fim);
    return this.service.listarRepasses(usuario.estabelecimentoId!, inicio, fim);
  }

  @Post('repasses/calcular')
  async calcularRepasses(@Body() dados: CalcularRepassesDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); this.validarPeriodo(dados?.inicio, dados?.fim);
    return this.service.calcularRepasses(usuario.estabelecimentoId!, usuario.id!, dados.inicio, dados.fim);
  }

  @Put('repasses/:id/pagar')
  async pagarRepasse(@Param('id') id: string, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); validarNumeroInteiroPositivo(id, 'Repasse');
    return this.service.pagarRepasse(Number(id), usuario.estabelecimentoId!, usuario.id!);
  }

  @Get('conciliacoes')
  async conciliacoes(@UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario);
    return this.service.listarConciliacoes(usuario.estabelecimentoId!);
  }

  @Post('conciliacoes')
  async conciliar(@Body() dados: ConciliarDto, @UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario); this.validarConciliacao(dados);
    return this.service.criarConciliacao(usuario.estabelecimentoId!, usuario.id!, dados);
  }

  @Get('auditoria')
  async auditoria(@UsuarioLogado() usuario: Usuario) {
    await this.policy.validarPermissao(usuario, 'FINANCEIRO_AUDITAR');
    return this.service.auditoria(usuario.estabelecimentoId!);
  }

  @Get('assinatura')
  async assinatura(@UsuarioLogado() usuario: Usuario) {
    await this.visualizar(usuario);
    return this.service.assinatura(usuario.estabelecimentoId!);
  }

  @Post('assinatura/cobrancas')
  async gerarCobranca(@UsuarioLogado() usuario: Usuario) {
    await this.gerenciar(usuario);
    return this.service.gerarCobrancaAssinatura(usuario.estabelecimentoId!, usuario.id!);
  }

  private visualizar(usuario: Usuario) { return this.policy.validarPermissao(usuario, 'FINANCEIRO_VISUALIZAR'); }
  private gerenciar(usuario: Usuario) { return this.policy.validarPermissao(usuario, 'FINANCEIRO_GERENCIAR'); }

  private validarPeriodo(inicio: string, fim: string) {
    validarData(inicio, 'Início'); validarData(fim, 'Fim');
    if (inicio > fim) throw new BadRequestException('Início deve ser anterior ao fim');
  }

  private validarPercentual(valor: unknown, campo: string) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0 || numero > 100) throw new BadRequestException(`${campo} deve estar entre 0 e 100`);
  }

  private validarValor(valor: unknown, campo: string, aceitaZero = false) {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || (aceitaZero ? numero < 0 : numero <= 0)) throw new BadRequestException(`${campo} inválido`);
  }

  private validarFormaPagamento(dados: SalvarFormaPagamentoDto) {
    validarTextoObrigatorio(dados?.nome, 'Nome');
    if (!TIPOS_FORMA_PAGAMENTO.includes(dados?.tipo as any)) throw new BadRequestException('Tipo de pagamento inválido');
    this.validarPercentual(dados?.taxaPercentual ?? 0, 'Taxa percentual');
    this.validarValor(dados?.taxaFixa ?? 0, 'Taxa fixa', true);
    validarNumeroInteiroNaoNegativo(dados?.prazoRecebimento ?? 0, 'Prazo de recebimento');
  }

  private validarConta(dados: CriarContaDto) {
    if (!TIPOS_CONTA.includes(dados?.tipo as any)) throw new BadRequestException('Tipo de conta inválido');
    validarTextoObrigatorio(dados?.descricao, 'Descrição'); this.validarValor(dados?.valorOriginal, 'Valor');
    validarData(dados?.competencia, 'Competência'); validarData(dados?.vencimento, 'Vencimento');
  }

  private validarConciliacao(dados: ConciliarDto) {
    validarTextoObrigatorio(dados?.provedor, 'Provedor'); validarTextoObrigatorio(dados?.transacaoExternaId, 'Transação externa');
    this.validarValor(dados?.valorEsperado, 'Valor esperado', true); this.validarValor(dados?.valorRecebido, 'Valor recebido', true);
  }
}
