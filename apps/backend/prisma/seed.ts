import { profissionais, servicos, Usuario } from '@barbabrutal/core';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BARBEARIA_PADRAO_ID = 1;
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? 'marcao@barberflowabs.app')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const senhaPadrao = '$2b$10$9LQTRK3LRzIddKYW2C4MTelydFzk5Ys4JoROPajNqvYshhrn1PRa6';

const barbeariasZonaLeste = [
  {
    nome: 'Barber Flow Tatuape',
    slug: 'barber-flow-tatuape',
    bairro: 'Tatuape',
    endereco: 'Rua Tuiuti, 1200',
    latitude: -23.53932,
    longitude: -46.57645,
    telefone: '(11) 94000-1001',
    email: 'tatuape@barberflowabs.app',
    destaque: true,
  },
  {
    nome: 'Barber Flow Mooca',
    slug: 'barber-flow-mooca',
    bairro: 'Mooca',
    endereco: 'Rua da Mooca, 2100',
    latitude: -23.56076,
    longitude: -46.59712,
    telefone: '(11) 94000-1002',
    email: 'mooca@barberflowabs.app',
    destaque: true,
  },
  {
    nome: 'Barber Flow Penha',
    slug: 'barber-flow-penha',
    bairro: 'Penha',
    endereco: 'Avenida Penha de Franca, 780',
    latitude: -23.52358,
    longitude: -46.54224,
    telefone: '(11) 94000-1003',
    email: 'penha@barberflowabs.app',
    destaque: false,
  },
  {
    nome: 'Barber Flow Vila Matilde',
    slug: 'barber-flow-vila-matilde',
    bairro: 'Vila Matilde',
    endereco: 'Avenida Waldemar Carlos Pereira, 520',
    latitude: -23.53673,
    longitude: -46.52923,
    telefone: '(11) 94000-1004',
    email: 'vilamatilde@barberflowabs.app',
    destaque: false,
  },
  {
    nome: 'Barber Flow Itaquera',
    slug: 'barber-flow-itaquera',
    bairro: 'Itaquera',
    endereco: 'Avenida Jacu-Pessego, 1800',
    latitude: -23.54052,
    longitude: -46.45591,
    telefone: '(11) 94000-1005',
    email: 'itaquera@barberflowabs.app',
    destaque: true,
  },
  {
    nome: 'Barber Flow Aricanduva',
    slug: 'barber-flow-aricanduva',
    bairro: 'Aricanduva',
    endereco: 'Avenida Aricanduva, 5555',
    latitude: -23.56627,
    longitude: -46.51189,
    telefone: '(11) 94000-1006',
    email: 'aricanduva@barberflowabs.app',
    destaque: false,
  },
  {
    nome: 'Barber Flow Vila Prudente',
    slug: 'barber-flow-vila-prudente',
    bairro: 'Vila Prudente',
    endereco: 'Avenida Paes de Barros, 3200',
    latitude: -23.58484,
    longitude: -46.58136,
    telefone: '(11) 94000-1007',
    email: 'vilaprudente@barberflowabs.app',
    destaque: false,
  },
  {
    nome: 'Barber Flow Sao Miguel',
    slug: 'barber-flow-sao-miguel',
    bairro: 'Sao Miguel Paulista',
    endereco: 'Avenida Marechal Tito, 4200',
    latitude: -23.49395,
    longitude: -46.44378,
    telefone: '(11) 94000-1008',
    email: 'saomiguel@barberflowabs.app',
    destaque: false,
  },
];

const servicosDemo = [
  {
    nome: 'Corte masculino',
    descricao: 'Corte alinhado ao estilo do cliente, com acabamento em maquina e tesoura.',
    preco: 55,
    qtdeSlots: 2,
    imagemURL: '/servicos/corte-de-cabelo.jpg',
  },
  {
    nome: 'Barba completa',
    descricao: 'Modelagem, toalha quente e finalizacao para barba.',
    preco: 45,
    qtdeSlots: 2,
    imagemURL: '/servicos/corte-de-barba.jpg',
  },
  {
    nome: 'Combo corte e barba',
    descricao: 'Pacote completo com corte, barba e finalizacao.',
    preco: 90,
    qtdeSlots: 3,
    imagemURL: '/servicos/combo.jpg',
  },
  {
    nome: 'Corte infantil',
    descricao: 'Atendimento tranquilo para criancas, com corte e acabamento.',
    preco: 50,
    qtdeSlots: 2,
    imagemURL: '/servicos/corte-infantil.jpg',
  },
];

const nomesProfissionais = [
  'Rafael Almeida',
  'Bruno Santos',
  'Caio Oliveira',
  'Diego Martins',
  'Felipe Costa',
  'Gustavo Rocha',
  'Henrique Lima',
  'Lucas Pereira',
];

const planosAssinatura = [
  {
    nome: 'Mensal',
    slug: 'mensal',
    descricao: 'Plano de entrada para validar a operação com baixo compromisso. Cobrança mensal via PIX a partir de R$ 49,90.',
    precoMensal: 49.9,
    limiteUsuarios: 3,
    limiteUnidades: 1,
    limiteServicos: 20,
    recursos: ['agenda', 'clientes', 'caixa', 'pix', 'ciclo_mensal'],
  },
  {
    nome: 'Trimestral',
    slug: 'trimestral',
    descricao: 'Ideal para manter a barbearia ativa por mais tempo, com desconto em relação ao pagamento mensal e cobrança via PIX a cada 3 meses.',
    precoMensal: 134.7,
    limiteUsuarios: 3,
    limiteUnidades: 1,
    limiteServicos: 20,
    recursos: ['agenda', 'clientes', 'caixa', 'pix', 'ciclo_trimestral', 'desconto_10'],
  },
  {
    nome: 'Anual',
    slug: 'anual',
    descricao: 'Melhor custo-benefício para quem já decidiu usar o Barber Flow ABS: maior desconto, previsibilidade anual e pagamento via PIX.',
    precoMensal: 479.04,
    limiteUsuarios: 3,
    limiteUnidades: 1,
    limiteServicos: 20,
    recursos: ['agenda', 'clientes', 'caixa', 'pix', 'ciclo_anual', 'desconto_20'],
  },
];

async function seed() {
  await seedPlanosAssinatura();

  await prisma.barbearia.upsert({
    where: { id: BARBEARIA_PADRAO_ID },
    update: {
      nome: 'Barber Flow ABS',
      slug: 'barber-flow-abs',
      telefone: '(11) 99999-9999',
      email: 'contato@barberflowabs.app',
      nomePublico: 'Barber Flow ABS',
      descricaoPublica: 'Agenda online, profissionais e servicos para uma experiencia completa de barbearia.',
      imagemCapaURL: '/banner.png',
      endereco: 'Rua Principal, 100',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      aceitaAgendamentoOnline: true,
      destaque: true,
      antecedenciaMinutos: 30,
      reviewStatus: 'APPROVED',
      approvedAt: new Date(),
      reviewReason: null,
    },
    create: {
      id: BARBEARIA_PADRAO_ID,
      nome: 'Barber Flow ABS',
      slug: 'barber-flow-abs',
      telefone: '(11) 99999-9999',
      email: 'contato@barberflowabs.app',
      nomePublico: 'Barber Flow ABS',
      descricaoPublica: 'Agenda online, profissionais e servicos para uma experiencia completa de barbearia.',
      imagemCapaURL: '/banner.png',
      endereco: 'Rua Principal, 100',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      aceitaAgendamentoOnline: true,
      destaque: true,
      antecedenciaMinutos: 30,
      reviewStatus: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  await prisma.unidade.upsert({
    where: {
      barbeariaId_nome: {
        barbeariaId: BARBEARIA_PADRAO_ID,
        nome: 'Unidade Principal',
      },
    },
    update: {},
    create: {
      barbeariaId: BARBEARIA_PADRAO_ID,
      nome: 'Unidade Principal',
      endereco: 'Rua Principal, 100',
      telefone: '(11) 99999-9999',
    },
  });

  await prisma.profissional.createMany({
    data: profissionais.map((profissional) => ({
      ...profissional,
      barbeariaId: BARBEARIA_PADRAO_ID,
    })) as any,
    skipDuplicates: true,
  });

  await prisma.servico.createMany({
    data: servicos.map((servico) => ({
      ...servico,
      barbeariaId: BARBEARIA_PADRAO_ID,
    })) as any,
    skipDuplicates: true,
  });

  await prisma.horarioFuncionamento.deleteMany({
    where: { barbeariaId: BARBEARIA_PADRAO_ID },
  });

  await prisma.horarioFuncionamento.createMany({
    data: [1, 2, 3, 4, 5, 6].map((diaSemana) => ({
      barbeariaId: BARBEARIA_PADRAO_ID,
      diaSemana,
      inicio: '08:00',
      fim: '21:00',
      intervaloInicio: '12:00',
      intervaloFim: '13:00',
      ativo: true,
    })),
  });

  // senha é... #Senha123
  const senha = senhaPadrao;

  const usuarios: Array<Usuario & { barbeariaId?: number | null }> = [
    {
      nome: 'Administrador Barber Flow ABS',
      barbeariaId: null,
      email: 'marcao@barberflowabs.app',
      senha,
      telefone: '(11) 99999-9999',
      barbeiro: false,
      papel: 'SUPER_ADMIN',
    },
    {
      nome: 'Leonardo Leitão',
      barbeariaId: BARBEARIA_PADRAO_ID,
      email: 'leonardo@formacao.dev',
      senha,
      telefone: '(11) 99999-9999',
      barbeiro: false,
      papel: 'CUSTOMER',
    },
  ];

  await prisma.usuario.createMany({ data: usuarios as any, skipDuplicates: true });

  await prisma.usuario.updateMany({
    where: { email: { in: SUPER_ADMIN_EMAILS } },
    data: {
      barbeariaId: null,
      barbeiro: false,
      papel: 'SUPER_ADMIN',
    },
  });

  await seedBarbeariasZonaLeste();
}

async function seedPlanosAssinatura() {
  for (const plano of planosAssinatura) {
    await prisma.planoAssinatura.upsert({
      where: { slug: plano.slug },
      update: plano,
      create: plano,
    });
  }

  await prisma.planoAssinatura.updateMany({
    where: { slug: { in: ['starter', 'professional', 'scale'] } },
    data: { ativo: false },
  });
}

async function seedBarbeariasZonaLeste() {
  const plano = await prisma.planoAssinatura.findUnique({ where: { slug: 'trimestral' } });

  for (const [indice, item] of barbeariasZonaLeste.entries()) {
    const barbearia = await prisma.barbearia.upsert({
      where: { slug: item.slug },
      update: {
        nome: item.nome,
        nomePublico: item.nome,
        telefone: item.telefone,
        email: item.email,
        descricaoPublica: `Unidade demo do Barber Flow ABS em ${item.bairro}, preparada para testes de mapa, busca por raio e agendamento online.`,
        imagemCapaURL: '/banners/principal.png',
        endereco: item.endereco,
        bairro: item.bairro,
        cidade: 'Sao Paulo',
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
        reviewReason: 'Barbearia demo aprovada pelo seed da Zona Leste.',
        antecedenciaMinutos: 30,
      } as any,
      create: {
        nome: item.nome,
        slug: item.slug,
        nomePublico: item.nome,
        telefone: item.telefone,
        email: item.email,
        descricaoPublica: `Unidade demo do Barber Flow ABS em ${item.bairro}, preparada para testes de mapa, busca por raio e agendamento online.`,
        imagemCapaURL: '/banners/principal.png',
        endereco: item.endereco,
        bairro: item.bairro,
        cidade: 'Sao Paulo',
        estado: 'SP',
        latitude: item.latitude,
        longitude: item.longitude,
        aceitaAgendamentoOnline: true,
        destaque: item.destaque,
        status: 'ACTIVE',
        reviewStatus: 'APPROVED',
        approvedAt: new Date(),
        reviewReason: 'Barbearia demo aprovada pelo seed da Zona Leste.',
        antecedenciaMinutos: 30,
        trialEndsAt: adicionarDias(new Date(), 14),
      } as any,
    });

    await prisma.unidade.upsert({
      where: {
        barbeariaId_nome: {
          barbeariaId: barbearia.id,
          nome: 'Matriz',
        },
      },
      update: {
        endereco: item.endereco,
        telefone: item.telefone,
      },
      create: {
        barbeariaId: barbearia.id,
        nome: 'Matriz',
        endereco: item.endereco,
        telefone: item.telefone,
      },
    });

    if (plano) {
      await prisma.assinaturaBarbearia.upsert({
        where: { barbeariaId: barbearia.id },
        update: {
          planoId: plano.id,
          status: 'ACTIVE',
          currentPeriodEnd: adicionarDias(new Date(), 30),
        },
        create: {
          barbeariaId: barbearia.id,
          planoId: plano.id,
          status: 'ACTIVE',
          currentPeriodEnd: adicionarDias(new Date(), 30),
        },
      });
    }

    await prisma.usuario.upsert({
      where: { email: `dono.${item.slug}@barberflowabs.app` },
      update: {
        nome: `Dono ${item.bairro}`,
        barbeariaId: barbearia.id,
        barbeiro: true,
        papel: 'BARBER',
      },
      create: {
        nome: `Dono ${item.bairro}`,
        email: `dono.${item.slug}@barberflowabs.app`,
        senha: senhaPadrao,
        telefone: item.telefone,
        barbeariaId: barbearia.id,
        barbeiro: true,
        papel: 'BARBER',
      },
    });

    await prisma.usuario.upsert({
      where: { email: `cliente.${item.slug}@barberflowabs.app` },
      update: {
        nome: `Cliente ${item.bairro}`,
        barbeariaId: barbearia.id,
        barbeiro: false,
        papel: 'CUSTOMER',
      },
      create: {
        nome: `Cliente ${item.bairro}`,
        email: `cliente.${item.slug}@barberflowabs.app`,
        senha: senhaPadrao,
        telefone: '(11) 95555-0000',
        barbeariaId: barbearia.id,
        barbeiro: false,
        papel: 'CUSTOMER',
      },
    });

    await prisma.profissional.createMany({
      data: [0, 1].map((offset) => ({
        barbeariaId: barbearia.id,
        nome: nomesProfissionais[(indice + offset) % nomesProfissionais.length],
        descricao: `Profissional especializado em corte, barba e acabamento na unidade ${item.bairro}.`,
        imagemURL: `/profissionais/profissional-${(offset % 6) + 1}.jpg`,
        avaliacao: 0,
        quantidadeAvaliacoes: 0,
      })),
      skipDuplicates: true,
    });

    await prisma.servico.createMany({
      data: servicosDemo.map((servico) => ({
        ...servico,
        barbeariaId: barbearia.id,
      })) as any,
      skipDuplicates: true,
    });

    await prisma.horarioFuncionamento.deleteMany({
      where: { barbeariaId: barbearia.id },
    });

    await prisma.horarioFuncionamento.createMany({
      data: [1, 2, 3, 4, 5, 6].map((diaSemana) => ({
        barbeariaId: barbearia.id,
        diaSemana,
        inicio: indice % 2 === 0 ? '08:00' : '09:00',
        fim: indice % 2 === 0 ? '20:00' : '21:00',
        intervaloInicio: '12:00',
        intervaloFim: '13:00',
        ativo: true,
      })),
    });

    await criarAvaliacoesDemo(barbearia.id, indice);
  }
}

async function criarAvaliacoesDemo(barbeariaId: number, indice: number) {
  const totalExistente = await (prisma as any).avaliacao.count({ where: { barbeariaId } });
  if (totalExistente > 0) return;

  const cliente = await prisma.usuario.findFirst({ where: { barbeariaId, barbeiro: false } });
  const profissional = await prisma.profissional.findFirst({ where: { barbeariaId } });
  const servico = await prisma.servico.findFirst({ where: { barbeariaId } });

  if (!cliente || !profissional || !servico) return;

  const notas = [5, 5, 4, 5];

  for (const [offset, nota] of notas.entries()) {
    const agendamento = await prisma.agendamento.create({
      data: {
        barbeariaId,
        usuarioId: cliente.id,
        profissionalId: profissional.id,
        data: adicionarDias(new Date(), -(offset + 2 + indice)),
        status: 'CONCLUIDO',
        valorTotal: servico.preco,
        servicos: {
          connect: [{ id: servico.id }],
        },
      },
    });

    await (prisma as any).avaliacao.create({
      data: {
        barbeariaId,
        agendamentoId: agendamento.id,
        usuarioId: cliente.id,
        profissionalId: profissional.id,
        nota,
        comentario: comentariosDemo[(indice + offset) % comentariosDemo.length],
        status: 'APPROVED',
      },
    });
  }

  const agregado = await (prisma as any).avaliacao.aggregate({
    where: { profissionalId: profissional.id, status: 'APPROVED' },
    _avg: { nota: true },
    _count: { nota: true },
  });

  await prisma.profissional.update({
    where: { id: profissional.id },
    data: {
      avaliacao: Number((agregado._avg.nota ?? 0).toFixed(1)),
      quantidadeAvaliacoes: agregado._count.nota ?? 0,
    },
  });
}

const comentariosDemo = [
  'Atendimento no horario e corte muito bem finalizado.',
  'Equipe atenciosa e ambiente organizado.',
  'Gostei da facilidade para agendar online.',
  'Barba bem feita e preco justo para a regiao.',
  'Experiencia rapida, pratica e profissional.',
];

function adicionarDias(data: Date, dias: number) {
  const novaData = new Date(data);
  novaData.setDate(novaData.getDate() + dias);
  return novaData;
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
