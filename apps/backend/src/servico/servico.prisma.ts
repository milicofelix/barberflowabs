import { RepositorioServico, Servico } from '@uniflowabs/core';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { DEFAULT_ESTABELECIMENTO_ID } from 'src/shared/tenant';
import { CriarServicoDto } from './servico.dto';

@Injectable()
export class ServicoPrisma implements RepositorioServico {
  constructor(private readonly prisma: PrismaService) {}

  async buscarTodos(estabelecimentoId = DEFAULT_ESTABELECIMENTO_ID): Promise<Servico[]> {
    const servicos = await this.prisma.servico.findMany({
      where: { estabelecimentoId },
    });
    return servicos.map((servico) => this.normalizar(servico));
  }

  async criar(estabelecimentoId: number, dados: CriarServicoDto): Promise<Servico> {
    const servico = await this.prisma.servico.create({
      data: {
        ...dados,
        estabelecimentoId,
      },
    });

    return this.normalizar(servico);
  }

  async atualizar(id: number, estabelecimentoId: number, dados: CriarServicoDto): Promise<Servico> {
    const servico = await this.prisma.servico.update({
      where: { id, estabelecimentoId },
      data: dados,
    });

    return this.normalizar(servico);
  }

  async excluir(id: number, estabelecimentoId: number): Promise<void> {
    await this.prisma.servico.delete({
      where: { id, estabelecimentoId },
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
