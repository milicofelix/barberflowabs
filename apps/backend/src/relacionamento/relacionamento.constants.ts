export const CANAIS_COMUNICACAO = ['PUSH', 'EMAIL', 'WHATSAPP'] as const;
export const EVENTOS_TEMPLATE = ['CONFIRMACAO_AGENDAMENTO', 'LEMBRETE_AGENDAMENTO', 'CAMPANHA', 'FIDELIDADE'] as const;
export const STATUS_ENVIO_COMUNICACAO = ['AGENDADO', 'PROCESSANDO', 'RETENTATIVA', 'ENVIADO', 'FALHA_PERMANENTE', 'FILA_MORTA', 'CANCELADO'] as const;
export const TIPOS_CALLBACK_COMUNICACAO = ['ACEITO', 'ENTREGUE', 'ABERTO', 'CLICADO', 'FALHOU'] as const;

export type CanalComunicacao = (typeof CANAIS_COMUNICACAO)[number];
export type EventoTemplate = (typeof EVENTOS_TEMPLATE)[number];
export type StatusEnvioComunicacao = (typeof STATUS_ENVIO_COMUNICACAO)[number];
export type TipoCallbackComunicacao = (typeof TIPOS_CALLBACK_COMUNICACAO)[number];
