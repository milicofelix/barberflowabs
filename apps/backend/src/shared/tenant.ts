export const DEFAULT_ESTABELECIMENTO_ID = Number(process.env.DEFAULT_ESTABELECIMENTO_ID ?? 1);
export const DEFAULT_ESTABELECIMENTO_SLUG =
  process.env.DEFAULT_ESTABELECIMENTO_SLUG ?? 'barber-flow-abs';

export const TENANT_ID_HEADER = 'x-estabelecimento-id';
export const TENANT_SLUG_HEADER = 'x-estabelecimento-slug';
