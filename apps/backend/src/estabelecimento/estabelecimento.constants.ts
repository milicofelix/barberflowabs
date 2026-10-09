export const TIPOS_ESTABELECIMENTO = [
  'BARBEARIA',
  'SALAO_BELEZA',
  'ESMALTERIA',
  'CLINICA_ESTETICA',
  'SPA_BEM_ESTAR',
  'ESTUDIO_BELEZA',
  'PROFISSIONAL_AUTONOMO',
  'OUTRO',
] as const;

export const MODELOS_ATENDIMENTO = ['PRESENCIAL', 'DOMICILIAR', 'HIBRIDO'] as const;

export type TipoEstabelecimento = (typeof TIPOS_ESTABELECIMENTO)[number];
export type ModeloAtendimento = (typeof MODELOS_ATENDIMENTO)[number];

export const TIPO_ESTABELECIMENTO_PADRAO: TipoEstabelecimento = 'BARBEARIA';
export const MODELO_ATENDIMENTO_PADRAO: ModeloAtendimento = 'PRESENCIAL';
