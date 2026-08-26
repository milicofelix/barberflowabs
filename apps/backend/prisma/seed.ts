import { profissionais, servicos, Usuario } from '@barbabrutal/core';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BARBEARIA_PADRAO_ID = 1;
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS ?? 'marcao@barberflowabs.app')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

async function seed() {
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
  const senha = '$2b$10$9LQTRK3LRzIddKYW2C4MTelydFzk5Ys4JoROPajNqvYshhrn1PRa6';

  const usuarios: Usuario[] = [
    {
      nome: 'Marcão Machadada',
      barbeariaId: BARBEARIA_PADRAO_ID,
      email: 'marcao@barberflowabs.app',
      senha,
      telefone: '(11) 99999-9999',
      barbeiro: true,
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
      barbeiro: true,
      papel: 'SUPER_ADMIN',
    },
  });
}

seed();
