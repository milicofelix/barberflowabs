export const TIPOS_CONTA = ['RECEBER', 'PAGAR'] as const;
export const STATUS_CONTA = ['PENDENTE', 'PARCIAL', 'PAGO', 'CANCELADO'] as const;
export const TIPOS_FORMA_PAGAMENTO = ['DINHEIRO', 'PIX', 'CREDITO', 'DEBITO', 'TRANSFERENCIA', 'OUTRO'] as const;
export const STATUS_REPASSE = ['PENDENTE', 'PAGO', 'CANCELADO'] as const;

export function chaveComissao(profissionalId?: number | null, servicoId?: number | null) {
  if (profissionalId && servicoId) return `PROFISSIONAL:${profissionalId}:SERVICO:${servicoId}`;
  if (servicoId) return `SERVICO:${servicoId}`;
  if (profissionalId) return `PROFISSIONAL:${profissionalId}`;
  return 'PADRAO';
}
