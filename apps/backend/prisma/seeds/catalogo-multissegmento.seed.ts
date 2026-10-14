import type { PrismaClient } from '@prisma/client';

const catalogo = [
  {
    segmentoSlug: 'barbearia',
    segmentoNome: 'Barbearia',
    especialidades: [
      ['cabelo', 'Cabelo'],
      ['barba', 'Barba'],
    ],
  },
  {
    segmentoSlug: 'salao-beleza',
    segmentoNome: 'Salão de beleza',
    especialidades: [
      ['cortes-e-penteados', 'Cortes e penteados'],
      ['coloracao', 'Coloração'],
      ['tratamentos-capilares', 'Tratamentos capilares'],
    ],
  },
  {
    segmentoSlug: 'manicure-pedicure',
    segmentoNome: 'Manicure e pedicure',
    especialidades: [
      ['manicure', 'Manicure'],
      ['pedicure', 'Pedicure'],
      ['alongamento-de-unhas', 'Alongamento de unhas'],
    ],
  },
  {
    segmentoSlug: 'clinica-estetica',
    segmentoNome: 'Clínica de estética',
    especialidades: [
      ['estetica-facial', 'Estética facial'],
      ['estetica-corporal', 'Estética corporal'],
      ['depilacao', 'Depilação'],
    ],
  },
  {
    segmentoSlug: 'spa-bem-estar',
    segmentoNome: 'Spa e bem-estar',
    especialidades: [
      ['massoterapia', 'Massoterapia'],
      ['terapias-relaxantes', 'Terapias relaxantes'],
      ['bem-estar', 'Bem-estar'],
    ],
  },
  {
    segmentoSlug: 'beleza',
    segmentoNome: 'Beleza',
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
    const segmento = await prisma.segmento.upsert({
      where: { slug: item.segmentoSlug },
      update: { nome: item.segmentoNome, ativo: true },
      create: {
        slug: item.segmentoSlug,
        nome: item.segmentoNome,
        descricao: `Serviços de ${item.segmentoNome.toLowerCase()} disponíveis no UniFlow ABS.`,
        ativo: true,
      },
      select: { id: true },
    });

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
