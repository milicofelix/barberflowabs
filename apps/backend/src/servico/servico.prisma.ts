import { RepositorioServico, Servico } from '@uniflowabs/core';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { DEFAULT_ESTABELECIMENTO_ID } from 'src/shared/tenant';
import { CriarServicoDto } from './servico.dto';

@Injectable()
export class ServicoPrisma implements RepositorioServico {
  constructor(private readonly prisma: PrismaService) {}

  async buscarTodos(estabelecimentoId = DEFAULT_ESTABELECIMENTO_ID): Promise<Servico[]> {
    const servicos = await this.prisma.servico.findMany({
      where: { estabelecimentoId },
      include: { profissionaisHabilitados: { where: { ativo: true }, select: { profissionalId: true } } },
    });
    return servicos.map((servico) => this.normalizar(servico));
  }

  async criar(estabelecimentoId: number, dados: CriarServicoDto): Promise<Servico> {
    const { profissionalIds, ...dadosServico } = dados;
    await this.validarProfissionais(estabelecimentoId, profissionalIds);
    const servico = await this.prisma.servico.create({
      data: {
        ...dadosServico,
        estabelecimentoId,
        profissionaisHabilitados: profissionalIds?.length ? {
          create: profissionalIds.map((profissionalId) => ({ estabelecimentoId, profissionalId, ativo: true })),
        } : undefined,
      } as any,
      include: { profissionaisHabilitados: { where: { ativo: true }, select: { profissionalId: true } } },
    });

    return this.normalizar(servico);
  }

  async atualizar(id: number, estabelecimentoId: number, dados: CriarServicoDto): Promise<Servico> {
    const { profissionalIds, ...dadosServico } = dados;
    await this.validarProfissionais(estabelecimentoId, profissionalIds);
    const servico = await this.prisma.$transaction(async (tx) => {
      if (profissionalIds !== undefined) {
        await (tx as any).profissionalServico.deleteMany({ where: { estabelecimentoId, servicoId: id } });
      }
      return (tx as any).servico.update({
        where: { id, estabelecimentoId },
        data: {
          ...dadosServico,
          profissionaisHabilitados: profissionalIds?.length ? {
            create: profissionalIds.map((profissionalId) => ({ estabelecimentoId, profissionalId, ativo: true })),
          } : undefined,
        },
        include: { profissionaisHabilitados: { where: { ativo: true }, select: { profissionalId: true } } },
      });
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
      profissionalIds: servico.profissionaisHabilitados?.map((item: any) => item.profissionalId) ?? [],
    };
  }

  private async validarProfissionais(estabelecimentoId: number, profissionalIds?: number[]) {
    if (profissionalIds === undefined) return;
    const ids = [...new Set(profissionalIds.map(Number))];
    const total = await this.prisma.profissional.count({ where: { estabelecimentoId, id: { in: ids } } });
    if (total !== ids.length) throw new BadRequestException('Um ou mais profissionais não pertencem ao estabelecimento');
  }
}
