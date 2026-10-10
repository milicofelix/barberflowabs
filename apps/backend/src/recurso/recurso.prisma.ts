import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { SalvarIndisponibilidadeRecursoDto, SalvarRecursoDto } from './recurso.dto';

@Injectable()
export class RecursoPrisma {
  constructor(private readonly prisma: PrismaService) {}

  listar(barbeariaId: number) {
    return (this.prisma as any).recurso.findMany({
      where: { barbeariaId },
      include: { unidade: { select: { id: true, nome: true } } },
      orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
    });
  }

  async criar(barbeariaId: number, dados: SalvarRecursoDto) {
    await this.validarUnidade(barbeariaId, dados.unidadeId);
    return (this.prisma as any).recurso.create({ data: this.dadosPersistencia(barbeariaId, dados) });
  }

  async atualizar(id: number, barbeariaId: number, dados: SalvarRecursoDto) {
    await this.validarExistencia(id, barbeariaId);
    await this.validarUnidade(barbeariaId, dados.unidadeId);
    return (this.prisma as any).recurso.update({
      where: { id },
      data: this.dadosPersistencia(barbeariaId, dados),
    });
  }

  async excluir(id: number, barbeariaId: number) {
    await this.validarExistencia(id, barbeariaId);
    const reservas = await (this.prisma as any).agendamentoRecurso.count({ where: { recursoId: id } });
    if (reservas > 0) {
      return (this.prisma as any).recurso.update({ where: { id }, data: { ativo: false } });
    }
    return (this.prisma as any).recurso.delete({ where: { id } });
  }

  async listarIndisponibilidades(recursoId: number, barbeariaId: number) {
    await this.validarExistencia(recursoId, barbeariaId);
    return (this.prisma as any).indisponibilidadeRecurso.findMany({
      where: { recursoId, barbeariaId, ativo: true }, orderBy: { inicio: 'asc' },
    });
  }

  async criarIndisponibilidade(recursoId: number, barbeariaId: number, dados: SalvarIndisponibilidadeRecursoDto) {
    await this.validarExistencia(recursoId, barbeariaId);
    return (this.prisma as any).indisponibilidadeRecurso.create({
      data: { recursoId, barbeariaId, inicio: new Date(dados.inicio), fim: new Date(dados.fim), motivo: dados.motivo?.trim() || null, ativo: dados.ativo ?? true },
    });
  }

  async removerIndisponibilidade(recursoId: number, id: number, barbeariaId: number) {
    const item = await (this.prisma as any).indisponibilidadeRecurso.findFirst({ where: { id, recursoId, barbeariaId } });
    if (!item) throw new NotFoundException('Indisponibilidade não encontrada');
    return (this.prisma as any).indisponibilidadeRecurso.update({ where: { id }, data: { ativo: false } });
  }

  private dadosPersistencia(barbeariaId: number, dados: SalvarRecursoDto) {
    return {
      barbeariaId,
      nome: dados.nome.trim(),
      tipo: dados.tipo.trim().toUpperCase(),
      capacidade: Number(dados.capacidade),
      unidadeId: dados.unidadeId ? Number(dados.unidadeId) : null,
      ativo: dados.ativo ?? true,
    };
  }

  private async validarExistencia(id: number, barbeariaId: number) {
    const recurso = await (this.prisma as any).recurso.findFirst({ where: { id, barbeariaId } });
    if (!recurso) throw new NotFoundException('Recurso não encontrado');
  }

  private async validarUnidade(barbeariaId: number, unidadeId?: number | null) {
    if (!unidadeId) return;
    const unidade = await this.prisma.unidade.findFirst({ where: { id: Number(unidadeId), barbeariaId } });
    if (!unidade) throw new BadRequestException('Unidade não pertence ao estabelecimento');
  }
}
