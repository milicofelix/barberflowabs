import type { PrismaClient } from '@prisma/client';
import { estabelecimentosMarketplaceTatuape } from './marketplace-tatuape.data';
import { imagemPadraoProfissional } from '@uniflowabs/core';

export async function seedMarketplaceTatuape(prisma: PrismaClient) {
  for (const item of estabelecimentosMarketplaceTatuape) {
    const estabelecimento = await prisma.estabelecimento.upsert({
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
      where: { estabelecimentoId: estabelecimento.id },
      data: { principal: false },
    });
    await prisma.estabelecimentoSegmento.upsert({
      where: { estabelecimentoId_segmentoId: { estabelecimentoId: estabelecimento.id, segmentoId: segmento.id } },
      update: { principal: true },
      create: { estabelecimentoId: estabelecimento.id, segmentoId: segmento.id, principal: true },
    });

    await seedEstruturaDoEstabelecimento(prisma, estabelecimento.id, item);
  }

  return estabelecimentosMarketplaceTatuape.length;
}

async function seedEstruturaDoEstabelecimento(
  prisma: PrismaClient,
  estabelecimentoId: number,
  item: (typeof estabelecimentosMarketplaceTatuape)[number],
) {
  await prisma.unidade.upsert({
    where: { estabelecimentoId_nome: { estabelecimentoId, nome: 'Matriz Tatuapé' } },
    update: { endereco: item.endereco, telefone: item.telefone, ativa: true },
    create: { estabelecimentoId, nome: 'Matriz Tatuapé', endereco: item.endereco, telefone: item.telefone },
  });

  const profissional = await prisma.profissional.upsert({
    where: { estabelecimentoId_nome: { estabelecimentoId, nome: item.profissional } },
    update: { descricao: `Especialista da ${item.nome}.`, sexo: sexoPeloNome(item.profissional) },
    create: {
      estabelecimentoId, nome: item.profissional, descricao: `Especialista da ${item.nome}.`,
      sexo: sexoPeloNome(item.profissional), imagemURL: imagemPadraoProfissional(sexoPeloNome(item.profissional)), avaliacao: 5, quantidadeAvaliacoes: 0,
    },
  });

  for (const servico of item.servicos) {
    const registro = await prisma.servico.upsert({
      where: { estabelecimentoId_nome: { estabelecimentoId, nome: servico.nome } },
      update: dadosDoServico(servico),
      create: { estabelecimentoId, nome: servico.nome, ...dadosDoServico(servico) },
    });
    await prisma.profissionalServico.upsert({
      where: { profissionalId_servicoId: { profissionalId: profissional.id, servicoId: registro.id } },
      update: { ativo: true },
      create: { estabelecimentoId, profissionalId: profissional.id, servicoId: registro.id, ativo: true },
    });
  }

  await prisma.horarioFuncionamento.deleteMany({ where: { estabelecimentoId } });
  await prisma.horarioFuncionamento.createMany({
    data: [1, 2, 3, 4, 5, 6].map((diaSemana) => ({
      estabelecimentoId, diaSemana, inicio: '09:00', fim: '20:00',
      intervaloInicio: '13:00', intervaloFim: '14:00', ativo: true,
    })),
  });
}

function sexoPeloNome(nome: string) {
  const nomesFemininos = ['Camila', 'Juliana', 'Larissa', 'Priscila', 'Marina', 'Renata', 'Aline', 'Isabela', 'Nathalia', 'Bianca'];
  return nomesFemininos.some((primeiroNome) => nome.startsWith(primeiroNome)) ? 'FEMININO' : 'MASCULINO';
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
