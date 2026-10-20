import type { PermissaoEquipe, ProfissionalOperacional } from '../operacao/tipos'

export type PermissaoFinanceira = Extract<PermissaoEquipe,
    'FINANCEIRO_VISUALIZAR' | 'FINANCEIRO_GERENCIAR' | 'FINANCEIRO_AUDITAR'>
export type TipoConta = 'RECEBER' | 'PAGAR'
export type StatusConta = 'PENDENTE' | 'PARCIAL' | 'PAGO' | 'CANCELADO' | 'ATRASADO'
export type StatusRepasse = 'PENDENTE' | 'PAGO' | 'CANCELADO'
export type TipoFormaPagamento = 'DINHEIRO' | 'PIX' | 'CREDITO' | 'DEBITO' | 'TRANSFERENCIA' | 'OUTRO'
export type ValorMonetario = number | string

export interface GrupoResumoConta {
    tipo: TipoConta
    status: Exclude<StatusConta, 'ATRASADO'>
    _sum: { valorOriginal: ValorMonetario | null; valorPago: ValorMonetario | null }
    _count: number
}

export interface AgregadoFinanceiro {
    _sum: Record<string, ValorMonetario | null>
    _count: number
}

export interface ResumoFinanceiro {
    contas: GrupoResumoConta[]
    repasses: AgregadoFinanceiro
    conciliacoes: AgregadoFinanceiro
}

export interface FormaPagamento {
    id: number
    nome: string
    tipo: TipoFormaPagamento
    taxaPercentual: ValorMonetario
    taxaFixa: ValorMonetario
    prazoRecebimento: number
    ativa: boolean
}

export interface ContaFinanceira {
    id: number
    agendamentoId?: number | null
    formaPagamentoId?: number | null
    tipo: TipoConta
    categoria?: string | null
    descricao: string
    documento?: string | null
    valorOriginal: ValorMonetario
    valorPago: ValorMonetario
    status: StatusConta
    competencia: string
    vencimento: string
    pagoEm?: string | null
    observacoes?: string | null
    formaPagamento?: FormaPagamento | null
    agendamento?: { id: number; data: string } | null
}

export interface ConfiguracaoComissao {
    id: number
    profissionalId?: number | null
    servicoId?: number | null
    chave: string
    percentual: ValorMonetario
    ativo: boolean
    profissional?: { id: number; nome: string } | null
    servico?: { id: number; nome: string } | null
}

export interface FechamentoCaixa {
    id: number
    status: 'ABERTO' | 'FECHADO'
    abertoEm: string
    fechadoEm?: string | null
    saldoInicial: ValorMonetario
    totalReceitas: ValorMonetario
    totalDespesas: ValorMonetario
    saldoEsperado: ValorMonetario
    saldoInformado?: ValorMonetario | null
    diferenca?: ValorMonetario | null
    observacoes?: string | null
    abertoPor: { id: number; nome: string }
    fechadoPor?: { id: number; nome: string } | null
}

export interface RepasseFinanceiro {
    id: number
    profissionalId: number
    periodoInicio: string
    periodoFim: string
    receitaBruta: ValorMonetario
    percentualMedio: ValorMonetario
    valorComissao: ValorMonetario
    ajustes: ValorMonetario
    valorLiquido: ValorMonetario
    status: StatusRepasse
    pagoEm?: string | null
    profissional: { id: number; nome: string }
}

export interface ConciliacaoFinanceira {
    id: number
    contaFinanceiraId?: number | null
    provedor: string
    transacaoExternaId: string
    valorEsperado: ValorMonetario
    valorRecebido: ValorMonetario
    diferenca: ValorMonetario
    status: 'PENDENTE' | 'CONCILIADO' | 'DIVERGENTE'
    conciliadoEm?: string | null
    observacoes?: string | null
    createdAt: string
    contaFinanceira?: { id: number; descricao: string } | null
}

export interface EventoAuditoriaFinanceira {
    id: number
    acao: string
    entidade: string
    entidadeId?: string | null
    detalhes?: Record<string, unknown> | null
    createdAt: string
    usuario?: { id: number; nome: string } | null
}

export interface CobrancaAssinatura {
    id: number
    provedor: string
    valor: ValorMonetario
    status: 'PENDENTE' | 'PAGO' | 'ATRASADA' | 'FALHOU' | 'CANCELADA'
    vencimento: string
    pagoEm?: string | null
    linkPagamento?: string | null
    codigoPix?: string | null
}

export interface AssinaturaEstabelecimento {
    id: number
    status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
    trialEndsAt?: string | null
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd: boolean
    plano: { id: number; nome: string; precoMensal: ValorMonetario }
    cobrancas: CobrancaAssinatura[]
}

export interface ServicoFinanceiro { id: number; nome: string }

export interface DadosFinanceiros {
    resumo: ResumoFinanceiro | null
    contas: ContaFinanceira[]
    comissoes: ConfiguracaoComissao[]
    formasPagamento: FormaPagamento[]
    caixas: FechamentoCaixa[]
    repasses: RepasseFinanceiro[]
    conciliacoes: ConciliacaoFinanceira[]
    auditoria: EventoAuditoriaFinanceira[]
    assinatura: AssinaturaEstabelecimento | null
    profissionais: ProfissionalOperacional[]
    servicos: ServicoFinanceiro[]
}

export interface CriarContaFinanceira {
    tipo: TipoConta; descricao: string; categoria?: string; documento?: string
    valorOriginal: number; competencia: string; vencimento: string; agendamentoId?: number; observacoes?: string
}

export interface SalvarFormaPagamento {
    nome: string; tipo: TipoFormaPagamento; taxaPercentual?: number; taxaFixa?: number
    prazoRecebimento?: number; ativa?: boolean
}
