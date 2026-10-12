import type { PrismaClient } from '@prisma/client';

const catalogo = [
  {
    segmentoSlug: 'barbearia',
    especialidades: [
      ['cabelo', 'Cabelo'],
      ['barba', 'Barba'],
    ],
  },
  {
    segmentoSlug: 'salao-beleza',
    especialidades: [
      ['cortes-e-penteados', 'Cortes e penteados'],
      ['coloracao', 'Coloração'],
      ['tratamentos-capilares', 'Tratamentos capilares'],
    ],
  },
  {
    segmentoSlug: 'manicure-pedicure',
    especialidades: [
      ['manicure', 'Manicure'],
      ['pedicure', 'Pedicure'],
      ['alongamento-de-unhas', 'Alongamento de unhas'],
    ],
  },
  {
    segmentoSlug: 'clinica-estetica',
    especialidades: [
      ['estetica-facial', 'Estética facial'],
      ['estetica-corporal', 'Estética corporal'],
      ['depilacao', 'Depilação'],
    ],
  },
  {
    segmentoSlug: 'spa-bem-estar',
    especialidades: [
      ['massoterapia', 'Massoterapia'],
      ['terapias-relaxantes', 'Terapias relaxantes'],
      ['bem-estar', 'Bem-estar'],
    ],
  },
  {
    segmentoSlug: 'beleza',
    especialidades: [
      ['maquiagem', 'Maquiagem'],
      ['sobrancelhas-e-cilios', 'Sobrancelhas e cílios'],
      ['producao-de-beleza', 'Produção de beleza'],
    ],
  },
] as const;

export async function seedCatalogoMultissegmento(prisma: PrismaClient) {
  let total = 0;

  for (const item of catalogo) {
    const segmento = await prisma.segmento.findUnique({
      where: { slug: item.segmentoSlug },
      select: { id: true },
    });
    if (!segmento) continue;

    for (const [slug, nome] of item.especialidades) {
      await prisma.especialidade.upsert({
        where: { segmentoId_slug: { segmentoId: segmento.id, slug } },
        update: { nome, ativo: true },
        create: {
          segmentoId: segmento.id,
          slug,
          nome,
          descricao: `Especialidade de ${nome.toLowerCase()}.`,
          ativo: true,
        },
      });
      total += 1;
    }
  }

  return total;
}
