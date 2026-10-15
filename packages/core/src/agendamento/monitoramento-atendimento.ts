export interface ConfiguracaoFluxoAtendimento {
    fluxoAtendimentoAutomaticoAtivo: boolean
    inicioAtendimentoAutomaticoAtivo: boolean
    finalizacaoAtendimentoAutomaticaAtiva: boolean
    avisoAtendimentoAntecedenciaMinutos: number
}
export interface MonitoramentoAtendimento {
    geradoEm: string
    workerHabilitado: boolean
    periodoDesde: string
    metricas: { automaticas: number; manuais: number; atrasos: number; tarefasAtrasadas: number; falhas: number; divergencias: number }
    tarefas: Array<{ id: number; agendamentoId: number; tipo: string; status: string; dataPrevista: string; tentativas: number; proximaTentativaEm: string | null }>
}
export const OPCOES_FLUXO_ATENDIMENTO = [
    { campo: 'fluxoAtendimentoAutomaticoAtivo', titulo: 'Fluxo automático de atendimento' },
    { campo: 'inicioAtendimentoAutomaticoAtivo', titulo: 'Iniciar automaticamente no horário' },
    { campo: 'finalizacaoAtendimentoAutomaticaAtiva', titulo: 'Finalizar automaticamente ao término' },
] as const
export const METRICAS_FLUXO_ATENDIMENTO = [
    { campo: 'automaticas', titulo: 'Transições automáticas (7 dias)' },
    { campo: 'manuais', titulo: 'Transições manuais (7 dias)' },
    { campo: 'atrasos', titulo: 'Atrasos registrados (7 dias)' },
    { campo: 'tarefasAtrasadas', titulo: 'Tarefas vencidas na fila' },
    { campo: 'falhas', titulo: 'Falhas pendentes' },
    { campo: 'divergencias', titulo: 'Finalizados sem receita (7 dias)' },
] as const
