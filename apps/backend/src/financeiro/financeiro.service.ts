import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ComissaoService } from './comissao.service';
import { chaveComissao } from './financeiro.constants';
import { FinanceiroRepository } from './financeiro.repository';
import { randomUUID } from 'crypto';
import { CaixaRepository } from './caixa.repository';
import { CobrancaRepository } from './cobranca.repository';
import { RepasseRepository } from './repasse.repository';

@Injectable()
export class FinanceiroService {
  constructor(
    private readonly repo: FinanceiroRepository,
    private readonly caixas: CaixaRepository,
    private readonly cobrancas: CobrancaRepository,
    private readonly repasses: RepasseRepository,
    private readonly comissoes: ComissaoService,
  ) {}

  listarComissoes(estabelecimentoId: number) {
    return this.repo.listarComissoes(estabelecimentoId);
  }

  async salvarComissao(estabelecimentoId: number, usuarioId: number, dados: any) {
    const profissionalId = dados.profissionalId ? Number(dados.profissionalId) : null;
    const servicoId = dados.servicoId ? Number(dados.servicoId) : null;
    const referenciasValidas = await this.repo.validarEntidadesComissao(estabelecimentoId, profissionalId, servicoId);
    if (!referenciasValidas) throw new NotFoundException('Profissional ou serviço não pertence ao estabelecimento');

    return this.repo.salvarComissao(
      estabelecimentoId,
      usuarioId,
      chaveComissao(profissionalId, servicoId),
      { profissionalId, servicoId, percentual: Number(dados.percentual), ativo: dados.ativo !== false },
    );
  }

  listarFormasPagamento(estabelecimentoId: number) {
    return this.repo.listarFormasPagamento(estabelecimentoId);
  }

  async salvarFormaPagamento(estabelecimentoId: number, usuarioId: number, dados: any, id?: number) {
    const forma = await this.repo.salvarFormaPagamento(estabelecimentoId, usuarioId, {
      nome: dados.nome.trim(),
      tipo: dados.tipo,
      taxaPercentual: Number(dados.taxaPercentual ?? 0),
      taxaFixa: Number(dados.taxaFixa ?? 0),
      prazoRecebimento: Number(dados.prazoRecebimento ?? 0),
      ativa: dados.ativa !== false,
    }, id);
    if (!forma) throw new NotFoundException('Forma de pagamento não encontrada');
    return forma;
  }

  async listarContas(estabelecimentoId: number, filtros: any) {
    const periodo = this.periodo(filtros.inicio, filtros.fim);
    const contas = await this.repo.listarContas(estabelecimentoId, { ...filtros, ...periodo });
    const agora = new Date();
    return contas.map((conta: any) => ({
      ...conta,
      valorOriginal: Number(conta.valorOriginal),
      valorPago: Number(conta.valorPago),
      status: conta.status === 'PENDENTE' && conta.vencimento < agora ? 'ATRASADO' : conta.status,
    }));
  }

  async criarConta(estabelecimentoId: number, usuarioId: number, dados: any) {
    const referenciasValidas = await this.repo.validarReferenciasConta(estabelecimentoId, dados.agendamentoId);
    if (!referenciasValidas) throw new NotFoundException('Agendamento não pertence ao estabelecimento');
    return this.repo.criarConta(estabelecimentoId, usuarioId, {
      tipo: dados.tipo,
      descricao: dados.descricao.trim(),
      categoria: dados.categoria?.trim() || null,
      documento: dados.documento?.trim() || null,
      valorOriginal: Number(dados.valorOriginal),
      competencia: new Date(dados.competencia),
      vencimento: new Date(dados.vencimento),
      agendamentoId: dados.agendamentoId ? Number(dados.agendamentoId) : null,
      observacoes: dados.observacoes?.trim() || null,
    });
  }

  registrarReceitaAgendamento(estabelecimentoId: number, usuarioId: number | null, agendamento: any) {
    return this.repo.registrarReceitaAgendamento(estabelecimentoId, usuarioId, agendamento);
  }

  async baixarConta(id: number, estabelecimentoId: number, usuarioId: number, dados: any) {
    const conta = await this.repo.buscarConta(id, estabelecimentoId);
    if (!conta) throw new NotFoundException('Conta não encontrada');
    if (conta.status === 'CANCELADO') throw new ConflictException('Conta cancelada não pode receber baixa');

    const pagamento = Number(dados.valorPago);
    const acumulado = Number(conta.valorPago) + pagamento;
    if (acumulado > Number(conta.valorOriginal)) throw new BadRequestException('Pagamento supera o saldo da conta');
    const referenciasValidas = await this.repo.validarReferenciasConta(estabelecimentoId, undefined, dados.formaPagamentoId);
    if (!referenciasValidas) throw new NotFoundException('Forma de pagamento não pertence ao estabelecimento');

    return this.repo.baixarConta(id, estabelecimentoId, usuarioId, {
      valorAnterior: conta.valorPago,
      valorPago: acumulado,
      pagoEm: new Date(dados.pagoEm),
      formaPagamentoId: dados.formaPagamentoId ? Number(dados.formaPagamentoId) : null,
      status: acumulado === Number(conta.valorOriginal) ? 'PAGO' : 'PARCIAL',
    });
  }

  async cancelarConta(id: number, estabelecimentoId: number, usuarioId: number) {
    const conta = await this.repo.buscarConta(id, estabelecimentoId);
    if (!conta) throw new NotFoundException('Conta não encontrada');
    if (Number(conta.valorPago) > 0 || conta.status === 'PAGO') {
      throw new ConflictException('Conta com pagamento não pode ser cancelada');
    }
    if (conta.status === 'CANCELADO') return conta;
    return this.repo.cancelarConta(id, estabelecimentoId, usuarioId);
  }

  listarCaixas(estabelecimentoId: number) {
    return this.caixas.listar(estabelecimentoId);
  }

  async abrirCaixa(estabelecimentoId: number, usuarioId: number, dados: any) {
    if (await this.caixas.caixaAberto(estabelecimentoId)) throw new ConflictException('Já existe um caixa aberto');
    try {
      return await this.caixas.abrir(estabelecimentoId, usuarioId, {
        chaveAberto: String(estabelecimentoId),
        saldoInicial: Number(dados.saldoInicial ?? 0),
        observacoes: dados.observacoes?.trim() || null,
      });
    } catch (erro: any) {
      if (erro?.code === 'P2002') throw new ConflictException('Já existe um caixa aberto');
      throw erro;
    }
  }

  async fecharCaixa(id: number, estabelecimentoId: number, usuarioId: number, dados: any) {
    const caixa = await this.caixas.buscar(id, estabelecimentoId);
    if (!caixa) throw new NotFoundException('Caixa não encontrado');
    if (caixa.status !== 'ABERTO') throw new ConflictException('Caixa já está fechado');

    const fechadoEm = new Date();
    const totais = await this.caixas.totais(estabelecimentoId, caixa.abertoEm, fechadoEm);
    const totalReceitas = this.totalPorTipo(totais, 'RECEBER');
    const totalDespesas = this.totalPorTipo(totais, 'PAGAR');
    const saldoEsperado = Number(caixa.saldoInicial) + totalReceitas - totalDespesas;
    const saldoInformado = Number(dados.saldoInformado);

    return this.caixas.fechar(id, estabelecimentoId, usuarioId, {
      status: 'FECHADO', chaveAberto: null, fechadoPorId: usuarioId, fechadoEm,
      totalReceitas, totalDespesas, saldoEsperado, saldoInformado,
      diferenca: saldoInformado - saldoEsperado,
      observacoes: dados.observacoes?.trim() || caixa.observacoes,
    });
  }

  listarRepasses(estabelecimentoId: number, inicio: string, fim: string) {
    const periodo = this.periodo(inicio, fim);
    return this.repasses.listar(estabelecimentoId, periodo.inicio, periodo.fim);
  }

  async calcularRepasses(estabelecimentoId: number, usuarioId: number, inicio: string, fim: string) {
    const periodo = this.periodo(inicio, fim);
    const [agendamentos, configuracoes] = await Promise.all([
      this.repasses.agendamentos(estabelecimentoId, periodo.inicio, periodo.fim),
      this.repo.listarComissoes(estabelecimentoId),
    ]);
    const repasses = this.agruparRepasses(agendamentos, configuracoes);
    return this.repasses.salvar(estabelecimentoId, usuarioId, periodo.inicio, periodo.fim, repasses);
  }

  async pagarRepasse(id: number, estabelecimentoId: number, usuarioId: number) {
    const repasse = await this.repasses.buscar(id, estabelecimentoId);
    if (!repasse) throw new NotFoundException('Repasse não encontrado');
    if (repasse.status !== 'PENDENTE') throw new ConflictException('Repasse não está pendente');
    return this.repasses.pagar(id, estabelecimentoId, usuarioId);
  }

  listarConciliacoes(estabelecimentoId: number) {
    return this.cobrancas.listarConciliacoes(estabelecimentoId);
  }

  async criarConciliacao(estabelecimentoId: number, usuarioId: number, dados: any) {
    const contaFinanceiraId = dados.contaFinanceiraId ? Number(dados.contaFinanceiraId) : null;
    if (contaFinanceiraId && !(await this.repo.buscarConta(contaFinanceiraId, estabelecimentoId))) {
      throw new NotFoundException('Conta financeira não pertence ao estabelecimento');
    }
    const provedor = dados.provedor.trim().toUpperCase();
    const transacaoExternaId = dados.transacaoExternaId.trim();
    const existente = await this.cobrancas.buscarConciliacao(estabelecimentoId, provedor, transacaoExternaId);
    if (existente?.contaFinanceiraId && existente.contaFinanceiraId !== contaFinanceiraId) {
      throw new ConflictException('Transação já conciliada com outra conta');
    }
    const esperado = Number(dados.valorEsperado);
    const recebido = Number(dados.valorRecebido);
    const diferenca = recebido - esperado;
    return this.cobrancas.criarConciliacao(estabelecimentoId, usuarioId, {
      contaFinanceiraId,
      provedor,
      transacaoExternaId,
      valorEsperado: esperado,
      valorRecebido: recebido,
      diferenca,
      status: Math.abs(diferenca) < 0.01 ? 'CONCILIADO' : 'DIVERGENTE',
      conciliadoEm: Math.abs(diferenca) < 0.01 ? new Date() : null,
      observacoes: dados.observacoes?.trim() || null,
    });
  }

  async resumo(estabelecimentoId: number, inicio: string, fim: string) {
    const periodo = this.periodo(inicio, fim);
    const [contas, repasses, conciliacoes] = await this.repo.resumo(estabelecimentoId, periodo.inicio, periodo.fim);
    return { contas, repasses, conciliacoes };
  }

  auditoria(estabelecimentoId: number) {
    return this.repo.auditoria(estabelecimentoId);
  }

  assinatura(estabelecimentoId: number) {
    return this.cobrancas.buscarAssinatura(estabelecimentoId);
  }

  gerarCobrancaAssinatura(estabelecimentoId: number, usuarioId: number) {
    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + 3);
    return this.cobrancas.criarCobranca(estabelecimentoId, usuarioId, `manual-${randomUUID()}`, vencimento);
  }

  processarEventoGateway(dados: any) {
    return this.cobrancas.registrarEvento(dados);
  }

  processarInadimplencia(usuarioId: number) {
    return this.cobrancas.processarInadimplencia(new Date(), usuarioId);
  }

  private agruparRepasses(agendamentos: any[], configuracoes: any[]) {
    const porProfissional = new Map<number, { profissionalId: number; receitaBruta: number; valorComissao: number }>();
    agendamentos.forEach((agendamento) => {
      const atual = porProfissional.get(agendamento.profissionalId) ?? { profissionalId: agendamento.profissionalId, receitaBruta: 0, valorComissao: 0 };
      const itens = agendamento.itens.length ? agendamento.itens : agendamento.servicos.map((item: any) => ({ servicoId: item.id, preco: item.preco }));
      itens.forEach((item: any) => {
        const valor = Number(item.preco);
        const percentual = this.comissoes.percentual(configuracoes, agendamento.profissionalId, item.servicoId);
        atual.receitaBruta += valor;
        atual.valorComissao += (valor * percentual) / 100;
      });
      porProfissional.set(agendamento.profissionalId, atual);
    });
    return Array.from(porProfissional.values()).map((item) => ({
      ...item,
      percentualMedio: item.receitaBruta ? (item.valorComissao / item.receitaBruta) * 100 : 0,
      ajustes: 0,
      valorLiquido: item.valorComissao,
      status: 'PENDENTE',
    }));
  }

  private totalPorTipo(totais: any[], tipo: string) {
    return Number(totais.find((item) => item.tipo === tipo)?._sum?.valorPago ?? 0);
  }

  private periodo(inicio: string, fim: string) {
    return { inicio: new Date(`${inicio}T00:00:00.000Z`), fim: new Date(`${fim}T23:59:59.999Z`) };
  }
}
