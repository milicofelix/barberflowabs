import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import Agendamento from '@barbabrutal/core/src/agendamento/model/Agendamento';
import RepositorioAgendamento from '@barbabrutal/core/src/agendamento/provider/RepositorioAgendamento';
import { DEFAULT_BARBEARIA_ID } from 'src/shared/tenant';

const STATUS_AGENDAMENTO_ATIVO = ['AGENDADO', 'CONFIRMADO', 'CHECKIN'];

@Injectable()
export class AgendamentoPrisma implements RepositorioAgendamento {
  constructor(private readonly prisma: PrismaService) {}

  private includeAgendamento() {
    return {
      usuario: { select: { id: true, barbeariaId: true, nome: true, email: true } },
      profissional: { select: { id: true, nome: true } },
      avaliacao: {
        select: { id: true, nota: true, comentario: true, createdAt: true },
      },
      servicos: {
        select: { id: true, nome: true, preco: true, qtdeSlots: true },
      },
    } as any;
  }

  private normalizarAgendamento(agendamento: any): Agendamento {
    delete agendamento.usuarioId;
    delete agendamento.profissionalId;

    return {
      ...agendamento,
      servicos: agendamento.servicos.map((servico: any) => ({
        ...servico,
        preco: Number(servico.preco),
      })),
    };
  }

  async criar(agendamento: Agendamento): Promise<void> {
    const barbeariaId = agendamento.usuario.barbeariaId ?? DEFAULT_BARBEARIA_ID;
    const servicoIds = agendamento.servicos.map((servico) => servico.id);
    const [profissional, servicos] = await Promise.all([
      this.prisma.profissional.findFirst({
        where: { id: agendamento.profissional.id, barbeariaId },
      }),
      this.prisma.servico.findMany({
        where: { id: { in: servicoIds }, barbeariaId },
        select: { preco: true },
      }),
    ]);

    if (!profissional || servicos.length !== servicoIds.length) {
      throw new Error('Profissional ou serviço não pertence à barbearia informada');
    }

    const valorTotal = servicos.reduce((total, servico) => total + Number(servico.preco), 0);

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(
        'SELECT id FROM profissionais WHERE id = ? AND barbeariaId = ? FOR UPDATE',
        agendamento.profissional.id,
        barbeariaId,
      );

      const conflito = await tx.agendamento.findFirst({
        where: {
          barbeariaId,
          profissionalId: agendamento.profissional.id,
          data: agendamento.data,
          status: { in: STATUS_AGENDAMENTO_ATIVO },
        },
        select: { usuarioId: true },
      });

      if (conflito?.usuarioId === agendamento.usuario.id) {
        throw new Error('Você já possui um agendamento ativo para esse horário');
      }

      if (conflito) {
        throw new Error('Esse horário acabou de ser reservado por outro cliente');
      }

      await tx.agendamento.create({
        data: {
          barbearia: { connect: { id: barbeariaId } },
          data: agendamento.data,
          status: 'AGENDADO',
          valorTotal,
          usuario: { connect: { id: agendamento.usuario.id } },
          profissional: { connect: { id: agendamento.profissional.id } },
          servicos: {
            connect: servicoIds.map((id) => ({ id })),
          },
        },
      });
    });
  }

  async buscarPorId(id: number): Promise<Agendamento | null> {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id },
      include: this.includeAgendamento(),
    } as any);

    return agendamento ? this.normalizarAgendamento(agendamento) : null;
  }

  async buscarPorEmail(email: string, barbeariaId?: number): Promise<Agendamento[]> {
    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        usuario: { email },
        ...(barbeariaId ? { barbeariaId } : {}),
      },
      include: this.includeAgendamento(),
      orderBy: { data: 'desc' },
      take: 100,
    } as any);

    return agendamentos.map((agendamento) => this.normalizarAgendamento(agendamento));
  }

  async buscarPorProfissionalEData(
    profissional: number,
    data: Date,
    barbeariaId = DEFAULT_BARBEARIA_ID,
  ): Promise<Agendamento[]> {
    const ano = data.getFullYear();
    const mes = data.getUTCMonth();
    const dia = data.getUTCDate();

    const inicioDoDia = new Date(ano, mes, dia, 0, 0, 0);
    const fimDoDia = new Date(ano, mes, dia, 23, 59, 59);

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        barbeariaId,
        profissionalId: profissional,
        status: { in: STATUS_AGENDAMENTO_ATIVO },
        data: { gte: inicioDoDia, lte: fimDoDia },
      },
      include: this.includeAgendamento(),
    } as any);

    return agendamentos.map((agendamento) => this.normalizarAgendamento(agendamento));
  }

  async excluir(id: number): Promise<void> {
    await this.prisma.agendamento.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
  }

  async cancelar(id: number, usuarioId: number, barbeariaId: number, barbeiro: boolean) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: {
        id,
        barbeariaId,
        status: { in: ['AGENDADO', 'CONFIRMADO'] },
        ...(barbeiro ? {} : { usuarioId }),
      },
      select: { id: true, data: true },
    });

    if (!agendamento) return null;

    if (agendamento.data.getTime() <= Date.now()) {
      throw new Error('Não é possível cancelar um horário que já passou');
    }

    const cancelado = await this.prisma.agendamento.update({
      where: { id },
      data: { status: 'CANCELADO' },
      include: this.includeAgendamento(),
    } as any);

    return this.normalizarAgendamento(cancelado);
  }

  async avaliar(id: number, usuarioId: number, nota: number, comentario?: string) {
    const agendamento: any = await (this.prisma.agendamento as any).findFirst({
      where: { id, usuarioId },
      select: {
        id: true,
        barbeariaId: true,
        usuarioId: true,
        profissionalId: true,
        status: true,
        data: true,
        avaliacao: { select: { id: true } },
      },
    });

    if (!agendamento) return null;

    if (agendamento.status !== 'CONCLUIDO') {
      throw new Error('Somente atendimentos concluídos podem ser avaliados');
    }

    if (agendamento.avaliacao) {
      throw new Error('Esse atendimento já foi avaliado');
    }

    const avaliacao = await (this.prisma as any).avaliacao.create({
      data: {
        barbeariaId: agendamento.barbeariaId,
        agendamentoId: agendamento.id,
        usuarioId: agendamento.usuarioId,
        profissionalId: agendamento.profissionalId,
        nota,
        comentario: comentario?.trim() || null,
        status: 'APPROVED',
      },
    });

    await this.atualizarMediaProfissional(agendamento.profissionalId);

    return avaliacao;
  }

  private async atualizarMediaProfissional(profissionalId: number) {
    const agregado = await (this.prisma as any).avaliacao.aggregate({
      where: { profissionalId, status: 'APPROVED' },
      _avg: { nota: true },
      _count: { nota: true },
    });

    await this.prisma.profissional.update({
      where: { id: profissionalId },
      data: {
        avaliacao: Number((agregado._avg.nota ?? 0).toFixed(1)),
        quantidadeAvaliacoes: agregado._count.nota ?? 0,
      },
    });
  }
}
