import { Profissional, RepositorioProfissional } from '@barbabrutal/core';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { DEFAULT_BARBEARIA_ID } from 'src/shared/tenant';

@Injectable()
export class ProfissionalPrisma implements RepositorioProfissional {
  constructor(private readonly prisma: PrismaService) {}

  buscarTodos(): Promise<Profissional[]> {
    return this.prisma.profissional.findMany({
      where: { barbeariaId: DEFAULT_BARBEARIA_ID },
    });
  }
}
