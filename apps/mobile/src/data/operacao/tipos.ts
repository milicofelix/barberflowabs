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
    periodos?: PeriodosAgendamentoOperacional
}

export interface PeriodoOperacional { inicio: string; fim: string }
export interface PeriodosAgendamentoOperacional {
    ocupacao: PeriodoOperacional
    deslocamentoAntes: PeriodoOperacional | null
    preparacaoAntes: PeriodoOperacional | null
    atendimento: PeriodoOperacional
    preparacaoDepois: PeriodoOperacional | null
    deslocamentoDepois: PeriodoOperacional | null
}

export interface RespostaAgendaOperacional {
    periodo: { inicio: string; fim: string; fusoHorario: string; convencao: '[inicio,fim)' }
    filtros: {
        unidadeId: number | null
        profissionalId: number | null
        recursoId: number | null
        servicoId: number | null
        status: string[]
    }
    pagina: { limite: number; temMais: boolean; proximoCursor: string | null }
    itens: AgendamentoOperacional[]
}

export interface ProfissionalOperacional {
    id: number
    nome: string
    descricao: string
    imagemURL: string
    avaliacao?: number
}

export type ModeloAtendimentoServico = 'PRESENCIAL' | 'DOMICILIAR' | 'HIBRIDO'

export interface ServicoOperacional {
    id: number
    nome: string
    descricao: string
    preco: number
    qtdeSlots: number
    imagemURL: string
    observacoes?: string | null
    modeloAtendimento?: ModeloAtendimentoServico
    duracaoMinutos?: number
    preparoAntesMinutos?: number
    preparoDepoisMinutos?: number
    deslocamentoMinutos?: number
    profissionalIds?: number[]
}

export type DadosServicoOperacional = Omit<ServicoOperacional, 'id' | 'qtdeSlots'>

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

export type SecaoOperacao = 'RESUMO' | 'AGENDA' | 'SERVICOS' | 'EQUIPE' | 'CAPACIDADE' | 'FINANCEIRO'
export type VisualizacaoAgenda = 'day' | '3days' | 'week' | 'schedule'
