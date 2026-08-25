export const DEFAULT_BARBEARIA_ID = Number(process.env.DEFAULT_BARBEARIA_ID ?? 1);
export const DEFAULT_BARBEARIA_SLUG =
  process.env.DEFAULT_BARBEARIA_SLUG ?? 'barber-flow-abs';

export const TENANT_ID_HEADER = 'x-barbearia-id';
export const TENANT_SLUG_HEADER = 'x-barbearia-slug';
