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

export type PermissaoEquipe = 'EQUIPE_GERENCIAR' | 'ESCALAS_GERENCIAR' | 'RECURSOS_GERENCIAR' | 'AGENDA_GERENCIAR' | 'FINANCEIRO_VISUALIZAR' | 'FINANCEIRO_GERENCIAR' | 'FINANCEIRO_AUDITAR' | 'RELACIONAMENTO_VISUALIZAR' | 'RELACIONAMENTO_GERENCIAR' | 'CONFIGURACOES_GERENCIAR'

export interface UsuarioEquipe { id: number; nome: string; email: string; telefone?: string | null }
export interface MembroEquipe {
    id: number; usuarioId: number; profissionalId?: number | null; papel: 'GESTOR' | 'RECEPCIONISTA' | 'PROFISSIONAL'
    permissoes: PermissaoEquipe[]; ativo: boolean; usuario: UsuarioEquipe; profissional?: { id: number; nome: string } | null
}
export interface EscalaProfissional {
    id?: number; diaSemana: number; inicio: string; fim: string; intervaloInicio?: string | null; intervaloFim?: string | null; ativo?: boolean
}
export interface RecursoOperacional { id: number; nome: string; tipo: string; capacidade: number; ativo: boolean }
export interface IndisponibilidadeRecurso { id: number; inicio: string; fim: string; motivo?: string | null }

export type SecaoOperacao = 'RESUMO' | 'AGENDA' | 'EQUIPE' | 'CAPACIDADE' | 'FINANCEIRO'
