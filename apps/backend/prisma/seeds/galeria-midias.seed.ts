import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
import { MidiaStorageService } from '../../src/midia/midia-storage.service';
import type { FinalidadeMidia } from '../../src/midia/midia.dto';

export async function seedGaleriaMidias(prisma: PrismaClient) {
  const storage = new MidiaStorageService();
  const raiz = resolve(process.env.MIDIA_GALERIA_DIR ?? '../frontend/public');
  const imagens: Array<[string, string, FinalidadeMidia, string | null, string]> = [
    ['corte', 'Corte de cabelo', 'SERVICO', 'barbearia', 'servicos/corte-de-cabelo.jpg'],
    ['barba', 'Barba', 'SERVICO', 'barbearia', 'servicos/corte-de-barba.jpg'],
    ['combo', 'Corte e barba', 'SERVICO', 'barbearia', 'servicos/combo.jpg'],
    ['infantil', 'Corte infantil', 'SERVICO', 'barbearia', 'servicos/corte-infantil.jpg'],
    ['unhas', 'Manicure e pedicure', 'SERVICO', 'manicure-pedicure', 'servicos/manicure-pedicure.jpg'],
  ];
  for (let indice = 1; indice <= 6; indice += 1) imagens.push([`profissional-${indice}`, `Profissional ${indice}`, 'PROFISSIONAL', null, `profissionais/profissional-${indice}.jpg`]);
  for (const [slug, titulo, arquivo] of [
    ['barbearia', 'Barbearia', 'barbearia'], ['salao-beleza', 'Salão de cabelo', 'salao-cabelo'],
    ['manicure-pedicure', 'Manicure e pedicure', 'manicure-pedicure'], ['clinica-estetica', 'Clínica de estética', 'clinica-estetica'],
    ['spa-bem-estar', 'Spa e bem-estar', 'spa-bem-estar'], ['beleza', 'Estética e beleza', 'estetica-beleza'],
  ]) for (const finalidade of ['CAPA', 'SERVICO'] as const) imagens.push([`${finalidade.toLowerCase()}-${slug}`, titulo, finalidade, slug, `estabelecimentos/${arquivo}-default.png`]);

  let criadas = 0;
  for (const [chaveCatalogo, titulo, finalidade, segmentoSlug, arquivo] of imagens) {
    const p = prisma as any;
    if (await p.midia.findUnique({ where: { chaveCatalogo } })) continue;
    const id = randomUUID();
    const versoes = await storage.processar(id, await readFile(resolve(raiz, arquivo)), finalidade);
    try {
      await p.midia.create({ data: { id, chaveCatalogo, titulo, finalidade, segmentoSlug, escopo: 'GLOBAL', versoes } });
      criadas += 1;
    } catch (erro) {
      await storage.remover(id);
      if (erro.code !== 'P2002') throw erro;
    }
  }
  return { criadas, previstas: imagens.length };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedGaleriaMidias(prisma).then((resultado) => console.info(`Galeria: ${resultado.criadas} imagens criadas; ${resultado.previstas} previstas.`))
    .catch((erro) => { console.error(erro); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
