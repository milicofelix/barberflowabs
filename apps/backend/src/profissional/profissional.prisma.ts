import { Profissional, RepositorioProfissional } from '@barbabrutal/core';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { DEFAULT_BARBEARIA_ID } from 'src/shared/tenant';
import { CriarProfissionalDto } from './profissional.dto';

@Injectable()
export class ProfissionalPrisma implements RepositorioProfissional {
  constructor(private readonly prisma: PrismaService) {}

  buscarTodos(barbeariaId = DEFAULT_BARBEARIA_ID): Promise<Profissional[]> {
    return this.prisma.profissional.findMany({
      where: { barbeariaId },
    });
  }

  criar(barbeariaId: number, dados: CriarProfissionalDto): Promise<Profissional> {
    return this.prisma.profissional.create({
      data: {
        ...dados,
        avaliacao: dados.avaliacao ?? 5,
        quantidadeAvaliacoes: dados.quantidadeAvaliacoes ?? 0,
        barbeariaId,
      },
    });
  }

  atualizar(
    id: number,
    barbeariaId: number,
    dados: CriarProfissionalDto,
  ): Promise<Profissional> {
    return this.prisma.profissional.update({
      where: { id, barbeariaId },
      data: {
        ...dados,
        avaliacao: dados.avaliacao ?? 5,
        quantidadeAvaliacoes: dados.quantidadeAvaliacoes ?? 0,
      },
    });
  }

  async excluir(id: number, barbeariaId: number): Promise<void> {
    await this.prisma.profissional.delete({
      where: { id, barbeariaId },
    });
  }
}
