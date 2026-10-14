import { PrismaClient } from '@prisma/client';

// Somente sugestões globais: nunca altera serviços adotados pelas unidades.
const chaves: Record<string, string> = {
  '/servicos/corte-de-cabelo.jpg': 'corte', '/servicos/corte-de-barba.jpg': 'barba',
  '/servicos/combo.jpg': 'combo', '/servicos/corte-infantil.jpg': 'infantil',
  '/servicos/manicure-pedicure.jpg': 'unhas',
};
export async function vincularCatalogoMidias(prisma: PrismaClient, aplicar = false) {
  const p = prisma as any;
  const itens = await p.servicoSugerido.findMany({ where: { imagemURL: { in: Object.keys(chaves) } }, select: { id: true, imagemURL: true } });
  let candidatas = 0, atualizadas = 0;
  for (const item of itens) {
    const midia = await p.midia.findUnique({ where: { chaveCatalogo: chaves[item.imagemURL] } });
    if (!midia || midia.escopo !== 'GLOBAL' || midia.finalidade !== 'SERVICO' || !midia.ativo || midia.status !== 'DISPONIVEL') continue;
    candidatas++;
    if (!aplicar) continue;
    const mudou = await prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      await tx.$queryRawUnsafe('SELECT id FROM midias WHERE id = ? FOR UPDATE', midia.id);
      const vigente = await tx.midia.findUnique({ where: { id: midia.id } });
      if (!vigente?.ativo || vigente.status !== 'DISPONIVEL') return false;
      const resultado = await tx.servicoSugerido.updateMany({ where: { id: item.id, imagemURL: item.imagemURL }, data: { imagemURL: vigente.versoes.principal.url } });
      if (!resultado.count) return false;
      await tx.midiaVinculo.upsert({ where: { entidade_entidadeId: { entidade: 'SERVICO_SUGERIDO', entidadeId: item.id } }, create: { entidade: 'SERVICO_SUGERIDO', entidadeId: item.id, midiaId: midia.id }, update: { midiaId: midia.id } });
      await tx.logAuditoria.create({ data: { acao: 'PADRONIZAR_IMAGEM', entidade: 'SERVICO_SUGERIDO', entidadeId: String(item.id), detalhes: { midiaId: midia.id, origem: 'SEED_GALERIA' } } });
      return true;
    });
    if (mudou) atualizadas++;
  }
  return { simulacao: !aplicar, candidatas, atualizadas };
}
if (require.main === module) {
  const prisma = new PrismaClient();
  vincularCatalogoMidias(prisma, process.argv.includes('--aplicar')).then((r) => console.info(JSON.stringify(r)))
    .catch(() => { console.error('Falha ao vincular catálogo e galeria; confira ambiente e migrations.'); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
