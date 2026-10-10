import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class CatalogoIntegridadePrisma {
  constructor(private readonly prisma: PrismaService) {}

  async validarClassificacao(segmentoIds: number[], especialidadeIds: number[]) {
    const segmentos = await (this.prisma as any).segmento.count({
      where: { id: { in: segmentoIds }, ativo: true },
    });
    const especialidades = await (this.prisma as any).especialidade.count({
      where: { id: { in: especialidadeIds }, segmentoId: { in: segmentoIds }, ativo: true },
    });
    if (segmentos !== segmentoIds.length || especialidades !== especialidadeIds.length) {
      throw new BadRequestException('Segmentos ou especialidades incompatíveis');
    }
  }

  async validarEspecialidades(estabelecimentoId: number, ids: number[]) {
    if (!ids.length) return;
    const quantidade = await (this.prisma as any).estabelecimentoEspecialidade.count({
      where: { estabelecimentoId, especialidadeId: { in: ids } },
    });
    if (quantidade !== ids.length) {
      throw new BadRequestException('Especialidade não pertence ao estabelecimento');
    }
  }

  async validarRequisitos(ids: number[]) {
    if (!ids.length) return;
    const quantidade = await (this.prisma as any).requisito.count({
      where: { id: { in: ids }, ativo: true },
    });
    if (quantidade !== ids.length) throw new BadRequestException('Requisito inválido');
  }

  async validarServicos(estabelecimentoId: number, ids: number[]) {
    if (!ids.length) return;
    const quantidade = await this.prisma.servico.count({ where: { estabelecimentoId, id: { in: ids } } });
    if (quantidade !== ids.length) throw new BadRequestException('Serviço não pertence ao estabelecimento');
  }

  async validarServicosCompativeis(estabelecimentoId: number, modeloAtendimento: string) {
    if (modeloAtendimento === 'HIBRIDO') return;
    const quantidade = await (this.prisma as any).servico.count({
      where: { estabelecimentoId, modeloAtendimento: { not: modeloAtendimento } },
    });
    if (quantidade > 0) {
      throw new BadRequestException('Existem serviços com modelo de atendimento incompatível');
    }
  }

  async validarEntidadeTenant(entidade: 'profissional' | 'servico', id: number, estabelecimentoId: number) {
    const registro = await (this.prisma as any)[entidade].findFirst({
      where: { id, estabelecimentoId },
      select: { id: true },
    });
    if (!registro) {
      throw new NotFoundException(`${entidade === 'servico' ? 'Serviço' : 'Profissional'} não encontrado`);
    }
  }
}
