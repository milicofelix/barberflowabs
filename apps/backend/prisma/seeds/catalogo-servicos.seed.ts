import { PrismaClient } from '@prisma/client';
import { seedCatalogoMultissegmento } from './catalogo-multissegmento.seed';
import { seedServicosSugeridos } from './servicos-sugeridos.seed';

const prisma = new PrismaClient();

async function executar() {
  const especialidades = await seedCatalogoMultissegmento(prisma);
  const servicos = await seedServicosSugeridos(prisma);
  console.info(`Catálogo inteligente atualizado: ${especialidades} especialidades e ${servicos} serviços sugeridos.`);
}

executar()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
