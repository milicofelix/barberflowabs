import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { ListarServicosSugeridosDto } from './catalogo.dto';

@Injectable()
export class CatalogoConsultaPrisma {
  constructor(private readonly prisma: PrismaService) {}

  listarSegmentos() {
    return (this.prisma as any).segmento.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      include: { especialidades: { where: { ativo: true }, orderBy: { nome: 'asc' } } },
    });
  }

  listarRequisitos() {
    return (this.prisma as any).requisito.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async listarServicosSugeridos(filtros: ListarServicosSugeridosDto) {
    const busca = filtros.busca?.trim();
    const sugestoes = await (this.prisma as any).servicoSugerido.findMany({
      where: {
        ativo: true,
        segmento: { ativo: true },
        ...(filtros.segmentoIds?.length ? { segmentoId: { in: filtros.segmentoIds } } : {}),
        ...(filtros.especialidadeIds?.length ? {
          especialidades: { some: { especialidadeId: { in: filtros.especialidadeIds }, especialidade: { ativo: true } } },
        } : {}),
        ...(busca ? { OR: [{ nome: { contains: busca } }, { descricao: { contains: busca } }] } : {}),
      },
      orderBy: [{ segmento: { nome: 'asc' } }, { ordem: 'asc' }, { nome: 'asc' }],
      include: {
        segmento: { select: { id: true, slug: true, nome: true } },
        especialidades: {
          where: { especialidade: { ativo: true } },
          include: { especialidade: { select: { id: true, slug: true, nome: true } } },
        },
      },
    });
    return sugestoes.map(({ especialidades, ...sugestao }: any) => ({
      ...sugestao,
      especialidades: especialidades.map((item: any) => item.especialidade),
    }));
  }

  async obterConfiguracao(estabelecimentoId: number) {
    const estabelecimento = await (this.prisma as any).estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      select: {
        id: true,
        nome: true,
        slug: true,
        tipoEstabelecimento: true,
        modeloAtendimento: true,
        segmentos: { include: { segmento: true } },
        especialidades: { include: { especialidade: { include: { segmento: true } } } },
      },
    });
    if (!estabelecimento) throw new NotFoundException('Estabelecimento não encontrado');
    return estabelecimento;
  }

  async obterModeloAtendimento(estabelecimentoId: number) {
    const registro = await (this.prisma as any).estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      select: { modeloAtendimento: true },
    });
    if (!registro) throw new NotFoundException('Estabelecimento não encontrado');
    return registro.modeloAtendimento;
  }
}
