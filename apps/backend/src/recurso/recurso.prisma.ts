import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { SalvarIndisponibilidadeRecursoDto, SalvarRecursoDto } from './recurso.dto';

@Injectable()
export class RecursoPrisma {
  constructor(private readonly prisma: PrismaService) {}

  listar(estabelecimentoId: number) {
    return (this.prisma as any).recurso.findMany({
      where: { estabelecimentoId },
      include: { unidade: { select: { id: true, nome: true } } },
      orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
    });
  }

  async criar(estabelecimentoId: number, dados: SalvarRecursoDto) {
    await this.validarUnidade(estabelecimentoId, dados.unidadeId);
    return (this.prisma as any).recurso.create({ data: this.dadosPersistencia(estabelecimentoId, dados) });
  }

  async atualizar(id: number, estabelecimentoId: number, dados: SalvarRecursoDto) {
    await this.validarExistencia(id, estabelecimentoId);
    await this.validarUnidade(estabelecimentoId, dados.unidadeId);
    return (this.prisma as any).recurso.update({
      where: { id },
      data: this.dadosPersistencia(estabelecimentoId, dados),
    });
  }

  async excluir(id: number, estabelecimentoId: number) {
    await this.validarExistencia(id, estabelecimentoId);
    const reservas = await (this.prisma as any).agendamentoRecurso.count({ where: { recursoId: id } });
    if (reservas > 0) {
      return (this.prisma as any).recurso.update({ where: { id }, data: { ativo: false } });
    }
    return (this.prisma as any).recurso.delete({ where: { id } });
  }

  async listarIndisponibilidades(recursoId: number, estabelecimentoId: number) {
    await this.validarExistencia(recursoId, estabelecimentoId);
    return (this.prisma as any).indisponibilidadeRecurso.findMany({
      where: { recursoId, estabelecimentoId, ativo: true }, orderBy: { inicio: 'asc' },
    });
  }

  async criarIndisponibilidade(recursoId: number, estabelecimentoId: number, dados: SalvarIndisponibilidadeRecursoDto) {
    await this.validarExistencia(recursoId, estabelecimentoId);
    return (this.prisma as any).indisponibilidadeRecurso.create({
      data: { recursoId, estabelecimentoId, inicio: new Date(dados.inicio), fim: new Date(dados.fim), motivo: dados.motivo?.trim() || null, ativo: dados.ativo ?? true },
    });
  }

  async removerIndisponibilidade(recursoId: number, id: number, estabelecimentoId: number) {
    const item = await (this.prisma as any).indisponibilidadeRecurso.findFirst({ where: { id, recursoId, estabelecimentoId } });
    if (!item) throw new NotFoundException('Indisponibilidade não encontrada');
    return (this.prisma as any).indisponibilidadeRecurso.update({ where: { id }, data: { ativo: false } });
  }

  private dadosPersistencia(estabelecimentoId: number, dados: SalvarRecursoDto) {
    return {
      estabelecimentoId,
      nome: dados.nome.trim(),
      tipo: dados.tipo.trim().toUpperCase(),
      capacidade: Number(dados.capacidade),
      unidadeId: dados.unidadeId ? Number(dados.unidadeId) : null,
      ativo: dados.ativo ?? true,
    };
  }

  private async validarExistencia(id: number, estabelecimentoId: number) {
    const recurso = await (this.prisma as any).recurso.findFirst({ where: { id, estabelecimentoId } });
    if (!recurso) throw new NotFoundException('Recurso não encontrado');
  }

  private async validarUnidade(estabelecimentoId: number, unidadeId?: number | null) {
    if (!unidadeId) return;
    const unidade = await this.prisma.unidade.findFirst({ where: { id: Number(unidadeId), estabelecimentoId } });
    if (!unidade) throw new BadRequestException('Unidade não pertence ao estabelecimento');
  }
}
