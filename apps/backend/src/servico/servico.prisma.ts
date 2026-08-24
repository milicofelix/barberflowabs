import { RepositorioServico, Servico } from '@barbabrutal/core';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class ServicoPrisma implements RepositorioServico {
  constructor(private readonly prisma: PrismaService) {}

  async buscarTodos(): Promise<Servico[]> {
    const servicos = await this.prisma.servico.findMany();
    return servicos.map((servico) => ({
      ...servico,
      preco: Number(servico.preco),
    }));
  }
}
