import { profissionais, servicos, Usuario } from '@barbabrutal/core';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  await prisma.profissional.createMany({
    data: profissionais as any,
  });

  await prisma.servico.createMany({
    data: servicos as any,
  });

  // senha é... #Senha123
  const senha = '$2b$10$9LQTRK3LRzIddKYW2C4MTelydFzk5Ys4JoROPajNqvYshhrn1PRa6';

  const usuarios: Usuario[] = [
    {
      nome: 'Marcão Machadada',
      email: 'marcao@barbabrutal.app',
      senha,
      telefone: '(11) 99999-9999',
      barbeiro: true,
    },
    {
      nome: 'Leonardo Leitão',
      email: 'leonardo@formacao.dev',
      senha,
      telefone: '(11) 99999-9999',
      barbeiro: false,
    },
  ];

  await prisma.usuario.createMany({ data: usuarios as any });
}

seed();
