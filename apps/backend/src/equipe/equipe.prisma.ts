import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { SalvarEscalaDto, SalvarMembroEquipeDto } from './equipe.dto';

@Injectable()
export class EquipePrisma {
  constructor(private readonly prisma: PrismaService) {}

  listar(estabelecimentoId: number) {
    return (this.prisma as any).membroEquipe.findMany({
      where: { estabelecimentoId },
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true } },
        profissional: { select: { id: true, nome: true, imagemURL: true } },
      },
      orderBy: [{ ativo: 'desc' }, { papel: 'asc' }],
    });
  }

  listarUsuariosDisponiveis(estabelecimentoId: number) {
    return this.prisma.usuario.findMany({
      where: { estabelecimentoId, vinculosEquipe: { none: { estabelecimentoId } } } as any,
      select: { id: true, nome: true, email: true, telefone: true },
      orderBy: { nome: 'asc' },
    });
  }

  async criar(estabelecimentoId: number, dados: SalvarMembroEquipeDto) {
    await this.validarVinculos(estabelecimentoId, dados);
    return (this.prisma as any).membroEquipe.create({
      data: this.dadosMembro(estabelecimentoId, dados),
    });
  }

  async atualizar(id: number, estabelecimentoId: number, dados: SalvarMembroEquipeDto) {
    const membro = await (this.prisma as any).membroEquipe.findFirst({ where: { id, estabelecimentoId } });
    if (!membro) throw new NotFoundException('Membro da equipe não encontrado');
    await this.validarVinculos(estabelecimentoId, dados);
    return (this.prisma as any).membroEquipe.update({
      where: { id }, data: this.dadosMembro(estabelecimentoId, dados),
    });
  }

  listarEscalas(profissionalId: number, estabelecimentoId: number) {
    return (this.prisma as any).escalaProfissional.findMany({
      where: { profissionalId, estabelecimentoId },
      include: { unidade: { select: { id: true, nome: true } } },
      orderBy: [{ diaSemana: 'asc' }, { inicio: 'asc' }],
    });
  }

  async salvarEscalas(profissionalId: number, estabelecimentoId: number, escalas: SalvarEscalaDto[]) {
    await this.validarProfissional(profissionalId, estabelecimentoId);
    await Promise.all(escalas.map((escala) => this.validarUnidade(escala.unidadeId, estabelecimentoId)));
    await this.prisma.$transaction(async (tx) => {
      await (tx as any).escalaProfissional.deleteMany({ where: { profissionalId, estabelecimentoId } });
      if (escalas.length) await (tx as any).escalaProfissional.createMany({
        data: escalas.map((escala) => ({ ...escala, estabelecimentoId, profissionalId, unidadeId: escala.unidadeId ?? null, ativo: escala.ativo ?? true })),
      });
    });
    return this.listarEscalas(profissionalId, estabelecimentoId);
  }

  private dadosMembro(estabelecimentoId: number, dados: SalvarMembroEquipeDto) {
    return { estabelecimentoId, usuarioId: Number(dados.usuarioId), profissionalId: dados.profissionalId ? Number(dados.profissionalId) : null,
      papel: dados.papel, permissoes: dados.permissoes, ativo: dados.ativo ?? true };
  }

  private async validarVinculos(estabelecimentoId: number, dados: SalvarMembroEquipeDto) {
    const usuario = await this.prisma.usuario.findFirst({ where: { id: Number(dados.usuarioId), estabelecimentoId } });
    if (!usuario) throw new BadRequestException('Usuário não pertence ao estabelecimento');
    if (dados.profissionalId) await this.validarProfissional(Number(dados.profissionalId), estabelecimentoId);
  }

  private async validarProfissional(id: number, estabelecimentoId: number) {
    const profissional = await this.prisma.profissional.findFirst({ where: { id, estabelecimentoId } });
    if (!profissional) throw new BadRequestException('Profissional não pertence ao estabelecimento');
  }

  private async validarUnidade(id: number | null | undefined, estabelecimentoId: number) {
    if (!id) return;
    const unidade = await this.prisma.unidade.findFirst({ where: { id: Number(id), estabelecimentoId } });
    if (!unidade) throw new BadRequestException('Unidade não pertence ao estabelecimento');
  }
}

