import type { PrismaClient } from '@prisma/client';
import { estabelecimentosMarketplaceTatuape } from './marketplace-tatuape.data';

export async function seedMarketplaceTatuape(prisma: PrismaClient) {
  for (const item of estabelecimentosMarketplaceTatuape) {
    const estabelecimento = await prisma.barbearia.upsert({
      where: { slug: item.slug },
      update: dadosDoEstabelecimento(item),
      create: { slug: item.slug, ...dadosDoEstabelecimento(item), trialEndsAt: adicionarDias(new Date(), 30) },
    });

    const segmento = await prisma.segmento.upsert({
      where: { slug: item.segmento.slug },
      update: { nome: item.segmento.nome, descricao: item.segmento.descricao, ativo: true },
      create: { ...item.segmento, ativo: true },
    });

    await prisma.estabelecimentoSegmento.updateMany({
      where: { barbeariaId: estabelecimento.id },
      data: { principal: false },
    });
    await prisma.estabelecimentoSegmento.upsert({
      where: { barbeariaId_segmentoId: { barbeariaId: estabelecimento.id, segmentoId: segmento.id } },
      update: { principal: true },
      create: { barbeariaId: estabelecimento.id, segmentoId: segmento.id, principal: true },
    });

    await seedEstruturaDoEstabelecimento(prisma, estabelecimento.id, item);
  }
}

async function seedEstruturaDoEstabelecimento(
  prisma: PrismaClient,
  barbeariaId: number,
  item: (typeof estabelecimentosMarketplaceTatuape)[number],
) {
  await prisma.unidade.upsert({
    where: { barbeariaId_nome: { barbeariaId, nome: 'Matriz Tatuapé' } },
    update: { endereco: item.endereco, telefone: item.telefone, ativa: true },
    create: { barbeariaId, nome: 'Matriz Tatuapé', endereco: item.endereco, telefone: item.telefone },
  });

  const profissional = await prisma.profissional.upsert({
    where: { barbeariaId_nome: { barbeariaId, nome: item.profissional } },
    update: { descricao: `Especialista da ${item.nome}.`, imagemURL: '/profissionais/profissional-1.jpg' },
    create: {
      barbeariaId, nome: item.profissional, descricao: `Especialista da ${item.nome}.`,
      imagemURL: '/profissionais/profissional-1.jpg', avaliacao: 5, quantidadeAvaliacoes: 0,
    },
  });

  for (const servico of item.servicos) {
    const registro = await prisma.servico.upsert({
      where: { barbeariaId_nome: { barbeariaId, nome: servico.nome } },
      update: dadosDoServico(servico),
      create: { barbeariaId, nome: servico.nome, ...dadosDoServico(servico) },
    });
    await prisma.profissionalServico.upsert({
      where: { profissionalId_servicoId: { profissionalId: profissional.id, servicoId: registro.id } },
      update: { ativo: true },
      create: { barbeariaId, profissionalId: profissional.id, servicoId: registro.id, ativo: true },
    });
  }

  await prisma.horarioFuncionamento.deleteMany({ where: { barbeariaId } });
  await prisma.horarioFuncionamento.createMany({
    data: [1, 2, 3, 4, 5, 6].map((diaSemana) => ({
      barbeariaId, diaSemana, inicio: '09:00', fim: '20:00',
      intervaloInicio: '13:00', intervaloFim: '14:00', ativo: true,
    })),
  });
}

function dadosDoEstabelecimento(item: (typeof estabelecimentosMarketplaceTatuape)[number]) {
  return {
    nome: item.nome,
    nomePublico: item.nome,
    tipoEstabelecimento: item.tipoEstabelecimento,
    modeloAtendimento: 'PRESENCIAL',
    telefone: item.telefone,
    email: `${item.slug}@demo.uniflowabs.app`,
    descricaoPublica: `${item.segmento.nome} no Tatuapé, cadastrado para demonstração do marketplace UniFlow ABS.`,
    imagemCapaURL: '/banners/principal.png',
    endereco: item.endereco,
    bairro: 'Tatuapé',
    cidade: 'São Paulo',
    estado: 'SP',
    latitude: item.latitude,
    longitude: item.longitude,
    aceitaAgendamentoOnline: true,
    destaque: item.destaque,
    status: 'ACTIVE',
    reviewStatus: 'APPROVED',
    approvedAt: new Date(),
    rejectedAt: null,
    rejectedById: null,
    reviewReason: 'Estabelecimento demonstrativo criado pelo seed do marketplace do Tatuapé.',
    antecedenciaMinutos: 30,
  };
}

function dadosDoServico(servico: (typeof estabelecimentosMarketplaceTatuape)[number]['servicos'][number]) {
  return {
    descricao: servico.descricao,
    preco: servico.preco,
    qtdeSlots: Math.ceil(servico.duracaoMinutos / 15),
    duracaoMinutos: servico.duracaoMinutos,
    imagemURL: servico.imagemURL,
    modeloAtendimento: 'PRESENCIAL',
  };
}

function adicionarDias(data: Date, dias: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}
