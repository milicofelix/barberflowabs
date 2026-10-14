export const STATUS_AGENDAMENTO = [
    'AGENDADO',
    'CONFIRMADO',
    'ATRASADO',
    'CHECKIN',
    'CONCLUIDO',
    'CANCELADO',
    'NO_SHOW',
] as const

export type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[number]

export const ORIGENS_TRANSICAO_ATENDIMENTO = ['MANUAL', 'AUTOMATICA'] as const
export type OrigemTransicaoAtendimento = (typeof ORIGENS_TRANSICAO_ATENDIMENTO)[number]

export const TIPOS_TRANSICAO_ATENDIMENTO = ['AVISO', 'INICIAR', 'FINALIZAR'] as const
export type TipoTransicaoAtendimento = (typeof TIPOS_TRANSICAO_ATENDIMENTO)[number]

export const STATUS_TRANSICAO_ATENDIMENTO = [
    'AGENDADA',
    'PROCESSANDO',
    'PROCESSADA',
    'CANCELADA',
    'FALHOU',
] as const
export type StatusTransicaoAtendimento = (typeof STATUS_TRANSICAO_ATENDIMENTO)[number]

export const ROTULOS_STATUS_AGENDAMENTO: Record<StatusAgendamento, string> = {
    AGENDADO: 'Agendado',
    CONFIRMADO: 'Confirmado',
    ATRASADO: 'Em atraso',
    CHECKIN: 'Em atendimento',
    CONCLUIDO: 'Finalizado',
    CANCELADO: 'Cancelado',
    NO_SHOW: 'Não compareceu',
}

export function statusAgendamentoValido(status: unknown): status is StatusAgendamento {
    return typeof status === 'string' && STATUS_AGENDAMENTO.includes(status as StatusAgendamento)
}
