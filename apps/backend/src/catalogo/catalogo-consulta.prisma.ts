import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

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

  async obterConfiguracao(barbeariaId: number) {
    const estabelecimento = await (this.prisma as any).barbearia.findUnique({
      where: { id: barbeariaId },
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

  async obterModeloAtendimento(barbeariaId: number) {
    const registro = await (this.prisma as any).barbearia.findUnique({
      where: { id: barbeariaId },
      select: { modeloAtendimento: true },
    });
    if (!registro) throw new NotFoundException('Estabelecimento não encontrado');
    return registro.modeloAtendimento;
  }
}
