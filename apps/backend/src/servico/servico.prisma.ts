import { RepositorioServico, Servico } from '@barbabrutal/core';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { DEFAULT_BARBEARIA_ID } from 'src/shared/tenant';
import { CriarServicoDto } from './servico.dto';

@Injectable()
export class ServicoPrisma implements RepositorioServico {
  constructor(private readonly prisma: PrismaService) {}

  async buscarTodos(barbeariaId = DEFAULT_BARBEARIA_ID): Promise<Servico[]> {
    const servicos = await this.prisma.servico.findMany({
      where: { barbeariaId },
    });
    return servicos.map((servico) => this.normalizar(servico));
  }

  async criar(barbeariaId: number, dados: CriarServicoDto): Promise<Servico> {
    const servico = await this.prisma.servico.create({
      data: {
        ...dados,
        barbeariaId,
      },
    });

    return this.normalizar(servico);
  }

  async atualizar(id: number, barbeariaId: number, dados: CriarServicoDto): Promise<Servico> {
    const servico = await this.prisma.servico.update({
      where: { id, barbeariaId },
      data: dados,
    });

    return this.normalizar(servico);
  }

  async excluir(id: number, barbeariaId: number): Promise<void> {
    await this.prisma.servico.delete({
      where: { id, barbeariaId },
    });
  }

  private normalizar(servico: any): Servico {
    return {
      ...servico,
      preco: Number(servico.preco),
      modeloAtendimento: servico.modeloAtendimento as Servico['modeloAtendimento'],
    };
  }
}
