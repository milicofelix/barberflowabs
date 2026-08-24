import { profissionais, servicos, Usuario } from '@barbabrutal/core';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BARBEARIA_PADRAO_ID = 1;

async function seed() {
  await prisma.barbearia.upsert({
    where: { slug: 'barba-brutal' },
    update: {},
    create: {
      id: BARBEARIA_PADRAO_ID,
      nome: 'Barba Brutal',
      slug: 'barba-brutal',
      telefone: '(11) 99999-9999',
      email: 'contato@barbabrutal.app',
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

  // senha é... #Senha123
  const senha = '$2b$10$9LQTRK3LRzIddKYW2C4MTelydFzk5Ys4JoROPajNqvYshhrn1PRa6';

  const usuarios: Usuario[] = [
    {
      nome: 'Marcão Machadada',
      barbeariaId: BARBEARIA_PADRAO_ID,
      email: 'marcao@barbabrutal.app',
      senha,
      telefone: '(11) 99999-9999',
      barbeiro: true,
    },
    {
      nome: 'Leonardo Leitão',
      barbeariaId: BARBEARIA_PADRAO_ID,
      email: 'leonardo@formacao.dev',
      senha,
      telefone: '(11) 99999-9999',
      barbeiro: false,
    },
  ];

  await prisma.usuario.createMany({ data: usuarios as any, skipDuplicates: true });
}

seed();
