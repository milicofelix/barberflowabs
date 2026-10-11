export const CANAIS_COMUNICACAO = ['PUSH', 'EMAIL', 'WHATSAPP'] as const;
export const EVENTOS_TEMPLATE = ['CONFIRMACAO_AGENDAMENTO', 'LEMBRETE_AGENDAMENTO', 'CAMPANHA', 'FIDELIDADE'] as const;

export type CanalComunicacao = (typeof CANAIS_COMUNICACAO)[number];
export type EventoTemplate = (typeof EVENTOS_TEMPLATE)[number];
