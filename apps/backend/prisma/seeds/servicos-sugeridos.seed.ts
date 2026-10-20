import type { PrismaClient } from '@prisma/client';

type Sugestao = {
  segmento: string;
  especialidade: string;
  slug: string;
  nome: string;
  descricao: string;
  duracao: number;
  preparoAntes?: number;
  preparoDepois?: number;
  imagem?: string;
};

const sugestoes: Sugestao[] = [
  { segmento: 'barbearia', especialidade: 'cabelo', slug: 'corte-social', nome: 'Corte social', descricao: 'Corte clássico masculino com acabamento.', duracao: 45, imagem: '/servicos/corte-de-cabelo.jpg' },
  { segmento: 'barbearia', especialidade: 'cabelo', slug: 'corte-degrade', nome: 'Corte degradê', descricao: 'Corte com transição gradual e acabamento.', duracao: 60, imagem: '/servicos/corte-de-cabelo.jpg' },
  { segmento: 'barbearia', especialidade: 'barba', slug: 'barba-tradicional', nome: 'Barba tradicional', descricao: 'Modelagem da barba e acabamento dos contornos.', duracao: 30, imagem: '/servicos/corte-de-barba.jpg' },
  { segmento: 'barbearia', especialidade: 'barba', slug: 'barboterapia', nome: 'Barboterapia', descricao: 'Barba com toalha quente, produtos e hidratação.', duracao: 45, preparoAntes: 5, preparoDepois: 5, imagem: '/servicos/corte-de-barba.jpg' },
  { segmento: 'barbearia', especialidade: 'cabelo', slug: 'corte-infantil', nome: 'Corte infantil', descricao: 'Corte de cabelo infantil com acabamento.', duracao: 45, imagem: '/servicos/corte-infantil.jpg' },
  { segmento: 'barbearia', especialidade: 'cabelo', slug: 'corte-e-barba', nome: 'Corte e barba', descricao: 'Combo completo de corte masculino e barba.', duracao: 75, imagem: '/servicos/combo.jpg' },

  { segmento: 'salao-beleza', especialidade: 'cortes-e-penteados', slug: 'corte-feminino', nome: 'Corte feminino', descricao: 'Corte personalizado conforme o estilo e tipo de cabelo.', duracao: 60 },
  { segmento: 'salao-beleza', especialidade: 'cortes-e-penteados', slug: 'escova', nome: 'Escova', descricao: 'Lavagem e modelagem dos cabelos com escova.', duracao: 60 },
  { segmento: 'salao-beleza', especialidade: 'cortes-e-penteados', slug: 'penteado', nome: 'Penteado', descricao: 'Penteado social ou para eventos.', duracao: 90 },
  { segmento: 'salao-beleza', especialidade: 'coloracao', slug: 'coloracao', nome: 'Coloração', descricao: 'Aplicação de coloração nos cabelos.', duracao: 120, preparoDepois: 15 },
  { segmento: 'salao-beleza', especialidade: 'coloracao', slug: 'mechas', nome: 'Mechas', descricao: 'Técnica de iluminação e tonalização dos fios.', duracao: 180, preparoDepois: 15 },
  { segmento: 'salao-beleza', especialidade: 'tratamentos-capilares', slug: 'hidratacao-capilar', nome: 'Hidratação capilar', descricao: 'Tratamento para reposição de água e maciez dos fios.', duracao: 60 },

  { segmento: 'manicure-pedicure', especialidade: 'manicure', slug: 'manicure-tradicional', nome: 'Manicure tradicional', descricao: 'Cuidado das unhas das mãos e esmaltação tradicional.', duracao: 45, imagem: '/servicos/manicure-pedicure.jpg' },
  { segmento: 'manicure-pedicure', especialidade: 'pedicure', slug: 'pedicure-tradicional', nome: 'Pedicure tradicional', descricao: 'Cuidado das unhas dos pés e esmaltação tradicional.', duracao: 60, imagem: '/servicos/manicure-pedicure.jpg' },
  { segmento: 'manicure-pedicure', especialidade: 'manicure', slug: 'esmaltacao-em-gel', nome: 'Esmaltação em gel', descricao: 'Esmaltação de longa duração com secagem em cabine.', duracao: 60, imagem: '/servicos/manicure-pedicure.jpg' },
  { segmento: 'manicure-pedicure', especialidade: 'alongamento-de-unhas', slug: 'alongamento-em-gel', nome: 'Alongamento em gel', descricao: 'Alongamento e modelagem de unhas em gel.', duracao: 150, imagem: '/servicos/manicure-pedicure.jpg' },
  { segmento: 'manicure-pedicure', especialidade: 'alongamento-de-unhas', slug: 'manutencao-alongamento', nome: 'Manutenção de alongamento', descricao: 'Manutenção periódica do alongamento de unhas.', duracao: 120, imagem: '/servicos/manicure-pedicure.jpg' },
  { segmento: 'manicure-pedicure', especialidade: 'pedicure', slug: 'spa-dos-pes', nome: 'Spa dos pés', descricao: 'Esfoliação, hidratação e cuidado relaxante dos pés.', duracao: 60, imagem: '/servicos/manicure-pedicure.jpg' },

  { segmento: 'clinica-estetica', especialidade: 'estetica-facial', slug: 'limpeza-de-pele', nome: 'Limpeza de pele', descricao: 'Higienização profunda, extração e finalização da pele.', duracao: 90, preparoAntes: 10, preparoDepois: 10 },
  { segmento: 'clinica-estetica', especialidade: 'estetica-facial', slug: 'peeling-facial', nome: 'Peeling facial', descricao: 'Renovação da pele conforme avaliação profissional.', duracao: 60, preparoAntes: 10, preparoDepois: 15 },
  { segmento: 'clinica-estetica', especialidade: 'estetica-corporal', slug: 'drenagem-linfatica', nome: 'Drenagem linfática', descricao: 'Massagem corporal com manobras de drenagem linfática.', duracao: 60 },
  { segmento: 'clinica-estetica', especialidade: 'estetica-corporal', slug: 'massagem-modeladora', nome: 'Massagem modeladora', descricao: 'Massagem corporal com manobras intensas e localizadas.', duracao: 60 },
  { segmento: 'clinica-estetica', especialidade: 'depilacao', slug: 'depilacao-facial', nome: 'Depilação facial', descricao: 'Remoção de pelos em áreas faciais selecionadas.', duracao: 30, preparoAntes: 5 },
  { segmento: 'clinica-estetica', especialidade: 'depilacao', slug: 'depilacao-corporal', nome: 'Depilação corporal', descricao: 'Remoção de pelos em área corporal selecionada.', duracao: 60, preparoAntes: 10 },

  { segmento: 'spa-bem-estar', especialidade: 'massoterapia', slug: 'massagem-relaxante', nome: 'Massagem relaxante', descricao: 'Massagem para relaxamento e redução de tensão muscular.', duracao: 60, preparoAntes: 10, preparoDepois: 10 },
  { segmento: 'spa-bem-estar', especialidade: 'massoterapia', slug: 'massagem-terapeutica', nome: 'Massagem terapêutica', descricao: 'Massagem direcionada a tensões e desconfortos musculares.', duracao: 60, preparoAntes: 10 },
  { segmento: 'spa-bem-estar', especialidade: 'terapias-relaxantes', slug: 'pedras-quentes', nome: 'Massagem com pedras quentes', descricao: 'Terapia relaxante com aplicação de pedras aquecidas.', duracao: 75, preparoAntes: 15, preparoDepois: 10 },
  { segmento: 'spa-bem-estar', especialidade: 'terapias-relaxantes', slug: 'aromaterapia', nome: 'Aromaterapia', descricao: 'Sessão de relaxamento com óleos essenciais.', duracao: 45, preparoAntes: 10 },
  { segmento: 'spa-bem-estar', especialidade: 'bem-estar', slug: 'reflexologia', nome: 'Reflexologia', descricao: 'Estimulação de pontos específicos nos pés.', duracao: 45 },
  { segmento: 'spa-bem-estar', especialidade: 'bem-estar', slug: 'day-spa', nome: 'Day spa', descricao: 'Experiência combinada de cuidados e relaxamento.', duracao: 180, preparoAntes: 15, preparoDepois: 15 },

  { segmento: 'beleza', especialidade: 'maquiagem', slug: 'maquiagem-social', nome: 'Maquiagem social', descricao: 'Maquiagem para eventos sociais e ocasiões especiais.', duracao: 60 },
  { segmento: 'beleza', especialidade: 'maquiagem', slug: 'maquiagem-noiva', nome: 'Maquiagem para noiva', descricao: 'Maquiagem de longa duração para casamento.', duracao: 120, preparoAntes: 15 },
  { segmento: 'beleza', especialidade: 'sobrancelhas-e-cilios', slug: 'design-de-sobrancelhas', nome: 'Design de sobrancelhas', descricao: 'Mapeamento e modelagem personalizada das sobrancelhas.', duracao: 30 },
  { segmento: 'beleza', especialidade: 'sobrancelhas-e-cilios', slug: 'henna-sobrancelhas', nome: 'Sobrancelhas com henna', descricao: 'Design com aplicação de henna para preenchimento.', duracao: 45 },
  { segmento: 'beleza', especialidade: 'sobrancelhas-e-cilios', slug: 'extensao-de-cilios', nome: 'Extensão de cílios', descricao: 'Aplicação de extensão de cílios conforme técnica escolhida.', duracao: 120, preparoAntes: 10 },
  { segmento: 'beleza', especialidade: 'producao-de-beleza', slug: 'producao-completa', nome: 'Produção completa', descricao: 'Produção combinada de maquiagem e finalização.', duracao: 120 },
];

export async function seedServicosSugeridos(prisma: PrismaClient) {
  const imagensSegmento: Record<string, string> = {
    'salao-beleza': '/estabelecimentos/salao-cabelo-default.png',
    'clinica-estetica': '/estabelecimentos/clinica-estetica-default.png',
    'spa-bem-estar': '/estabelecimentos/spa-bem-estar-default.png',
    beleza: '/estabelecimentos/estetica-beleza-default.png',
  };
  let processados = 0;
  for (const [ordem, item] of sugestoes.entries()) {
    const especialidade = await prisma.especialidade.findFirst({
      where: { slug: item.especialidade, segmento: { slug: item.segmento } },
      select: { id: true, segmentoId: true },
    });
    if (!especialidade) continue;
    const existente = await (prisma as any).servicoSugerido.findUnique({
      where: { segmentoId_slug: { segmentoId: especialidade.segmentoId, slug: item.slug } }, select: { id: true },
    });
    if (existente) { processados += 1; continue; }
    const servico = await (prisma as any).servicoSugerido.upsert({
      where: { segmentoId_slug: { segmentoId: especialidade.segmentoId, slug: item.slug } },
      update: {},
      create: {
        segmentoId: especialidade.segmentoId, slug: item.slug, nome: item.nome,
        descricao: item.descricao, imagemURL: item.imagem ?? imagensSegmento[item.segmento] ?? '/servicos/combo.jpg',
        duracaoMinutos: item.duracao, preparoAntesMinutos: item.preparoAntes ?? 0,
        preparoDepoisMinutos: item.preparoDepois ?? 0, ordem, ativo: true,
      },
      select: { id: true },
    });
    await (prisma as any).servicoSugeridoEspecialidade.upsert({
      where: { servicoSugeridoId_especialidadeId: { servicoSugeridoId: servico.id, especialidadeId: especialidade.id } },
      update: {}, create: { servicoSugeridoId: servico.id, especialidadeId: especialidade.id },
    });
    processados += 1;
  }
  return processados;
}
