import { RepositorioServico, Servico } from '@barbabrutal/core';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { DEFAULT_BARBEARIA_ID } from 'src/shared/tenant';

@Injectable()
export class ServicoPrisma implements RepositorioServico {
  constructor(private readonly prisma: PrismaService) {}

  async buscarTodos(barbeariaId = DEFAULT_BARBEARIA_ID): Promise<Servico[]> {
    const servicos = await this.prisma.servico.findMany({
      where: { barbeariaId },
    });
    return servicos.map((servico) => ({
      ...servico,
      preco: Number(servico.preco),
    }));
  }
}
