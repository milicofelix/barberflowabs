export interface DashboardOperacional {
    data: string
    agendamentosHoje: number
    clientes: number
    receitaHoje: number
    receitaMes: number
    despesasMes: number
    saldoMes: number
}

export interface AgendamentoOperacional {
    id: number
    data: string
    status: string
    valorTotal: number
    usuario?: { nome: string }
    profissional?: { id: number; nome: string }
    servicos?: Array<{ nome: string }>
}

export interface ProfissionalOperacional {
    id: number
    nome: string
    descricao: string
    imagemURL: string
    avaliacao?: number
}

export interface LancamentoFinanceiro {
    id: number
    tipo: 'RECEITA' | 'DESPESA'
    descricao: string
    categoria?: string | null
    valor: number
    data: string
}

export type SecaoOperacao = 'RESUMO' | 'AGENDA' | 'EQUIPE' | 'FINANCEIRO'
