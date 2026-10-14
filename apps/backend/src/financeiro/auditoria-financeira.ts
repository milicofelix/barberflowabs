export function auditarFinanceiro(
  tx: any,
  estabelecimentoId: number,
  usuarioId: number | null,
  acao: string,
  entidade: string,
  entidadeId: number | null,
  detalhes: any,
) {
  return tx.logAuditoria.create({
    data: {
      estabelecimentoId,
      usuarioId,
      acao,
      entidade,
      entidadeId: entidadeId ? String(entidadeId) : null,
      detalhes: JSON.parse(JSON.stringify(detalhes ?? {})),
    },
  });
}
