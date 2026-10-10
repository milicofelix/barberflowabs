import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { SalvarEscalaDto, SalvarMembroEquipeDto } from './equipe.dto';

@Injectable()
export class EquipePrisma {
  constructor(private readonly prisma: PrismaService) {}

  listar(barbeariaId: number) {
    return (this.prisma as any).membroEquipe.findMany({
      where: { barbeariaId },
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true } },
        profissional: { select: { id: true, nome: true, imagemURL: true } },
      },
      orderBy: [{ ativo: 'desc' }, { papel: 'asc' }],
    });
  }

  listarUsuariosDisponiveis(barbeariaId: number) {
    return this.prisma.usuario.findMany({
      where: { barbeariaId, vinculosEquipe: { none: { barbeariaId } } } as any,
      select: { id: true, nome: true, email: true, telefone: true },
      orderBy: { nome: 'asc' },
    });
  }

  async criar(barbeariaId: number, dados: SalvarMembroEquipeDto) {
    await this.validarVinculos(barbeariaId, dados);
    return (this.prisma as any).membroEquipe.create({
      data: this.dadosMembro(barbeariaId, dados),
    });
  }

  async atualizar(id: number, barbeariaId: number, dados: SalvarMembroEquipeDto) {
    const membro = await (this.prisma as any).membroEquipe.findFirst({ where: { id, barbeariaId } });
    if (!membro) throw new NotFoundException('Membro da equipe não encontrado');
    await this.validarVinculos(barbeariaId, dados);
    return (this.prisma as any).membroEquipe.update({
      where: { id }, data: this.dadosMembro(barbeariaId, dados),
    });
  }

  listarEscalas(profissionalId: number, barbeariaId: number) {
    return (this.prisma as any).escalaProfissional.findMany({
      where: { profissionalId, barbeariaId },
      include: { unidade: { select: { id: true, nome: true } } },
      orderBy: [{ diaSemana: 'asc' }, { inicio: 'asc' }],
    });
  }

  async salvarEscalas(profissionalId: number, barbeariaId: number, escalas: SalvarEscalaDto[]) {
    await this.validarProfissional(profissionalId, barbeariaId);
    await Promise.all(escalas.map((escala) => this.validarUnidade(escala.unidadeId, barbeariaId)));
    await this.prisma.$transaction(async (tx) => {
      await (tx as any).escalaProfissional.deleteMany({ where: { profissionalId, barbeariaId } });
      if (escalas.length) await (tx as any).escalaProfissional.createMany({
        data: escalas.map((escala) => ({ ...escala, barbeariaId, profissionalId, unidadeId: escala.unidadeId ?? null, ativo: escala.ativo ?? true })),
      });
    });
    return this.listarEscalas(profissionalId, barbeariaId);
  }

  private dadosMembro(barbeariaId: number, dados: SalvarMembroEquipeDto) {
    return { barbeariaId, usuarioId: Number(dados.usuarioId), profissionalId: dados.profissionalId ? Number(dados.profissionalId) : null,
      papel: dados.papel, permissoes: dados.permissoes, ativo: dados.ativo ?? true };
  }

  private async validarVinculos(barbeariaId: number, dados: SalvarMembroEquipeDto) {
    const usuario = await this.prisma.usuario.findFirst({ where: { id: Number(dados.usuarioId), barbeariaId } });
    if (!usuario) throw new BadRequestException('Usuário não pertence ao estabelecimento');
    if (dados.profissionalId) await this.validarProfissional(Number(dados.profissionalId), barbeariaId);
  }

  private async validarProfissional(id: number, barbeariaId: number) {
    const profissional = await this.prisma.profissional.findFirst({ where: { id, barbeariaId } });
    if (!profissional) throw new BadRequestException('Profissional não pertence ao estabelecimento');
  }

  private async validarUnidade(id: number | null | undefined, barbeariaId: number) {
    if (!id) return;
    const unidade = await this.prisma.unidade.findFirst({ where: { id: Number(id), barbeariaId } });
    if (!unidade) throw new BadRequestException('Unidade não pertence ao estabelecimento');
  }
}

