import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import Agendamento from '@uniflowabs/core/src/agendamento/model/Agendamento';
import RepositorioAgendamento from '@uniflowabs/core/src/agendamento/provider/RepositorioAgendamento';
import { DEFAULT_ESTABELECIMENTO_ID } from 'src/shared/tenant';

const STATUS_AGENDAMENTO_ATIVO = ['AGENDADO', 'CONFIRMADO', 'ATRASADO', 'CHECKIN'];

@Injectable()
export class AgendamentoPrisma implements RepositorioAgendamento {
  constructor(private readonly prisma: PrismaService) {}

  private includeAgendamento() {
    return {
      usuario: { select: { id: true, estabelecimentoId: true, nome: true, email: true } },
      estabelecimento: { select: { id: true, nome: true, slug: true } },
      profissional: { select: { id: true, nome: true } },
      unidade: { select: { id: true, nome: true } },
      avaliacao: {
        select: { id: true, nota: true, comentario: true, createdAt: true },
      },
      servicos: {
        select: { id: true, nome: true, preco: true, qtdeSlots: true, duracaoMinutos: true },
      },
      itens: { orderBy: { ordem: 'asc' }, include: { servico: { select: { id: true, nome: true } } } },
      recursos: { include: { recurso: { select: { id: true, nome: true, tipo: true } } } },
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
    const estabelecimentoId = agendamento.usuario.estabelecimentoId ?? DEFAULT_ESTABELECIMENTO_ID;
    const servicoIds = agendamento.servicos.map((servico) => servico.id);
    const [profissional, servicos] = await Promise.all([
      this.prisma.profissional.findFirst({
        where: { id: agendamento.profissional.id, estabelecimentoId },
      }),
      this.prisma.servico.findMany({
        where: { id: { in: servicoIds }, estabelecimentoId },
        select: { preco: true },
      }),
    ]);

    if (!profissional || servicos.length !== servicoIds.length) {
      throw new Error('Profissional ou serviço não pertence ao estabelecimento informado');
    }

    const valorTotal = servicos.reduce((total, servico) => total + Number(servico.preco), 0);

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(
        'SELECT id FROM profissionais WHERE id = ? AND estabelecimentoId = ? FOR UPDATE',
        agendamento.profissional.id,
        estabelecimentoId,
      );

      const conflito = await tx.agendamento.findFirst({
        where: {
          estabelecimentoId,
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
          estabelecimento: { connect: { id: estabelecimentoId } },
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

      await (tx as any).clienteEstabelecimento.upsert({
        where: {
          estabelecimentoId_usuarioId: {
            estabelecimentoId,
            usuarioId: agendamento.usuario.id!,
          },
        },
        update: {
          ultimoAgendamentoEm: agendamento.data,
        },
        create: {
          estabelecimentoId,
          usuarioId: agendamento.usuario.id!,
          origem: 'AGENDAMENTO',
          primeiroAgendamentoEm: agendamento.data,
          ultimoAgendamentoEm: agendamento.data,
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

  async buscarPorEmail(email: string, estabelecimentoId?: number): Promise<Agendamento[]> {
    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        usuario: { email },
        ...(estabelecimentoId ? { estabelecimentoId } : {}),
      },
      include: this.includeAgendamento(),
      orderBy: { data: 'desc' },
      take: 100,
    } as any);

    return agendamentos.map((agendamento) => this.normalizarAgendamento(agendamento));
  }

  async buscarAtivosPorUsuario(usuarioId: number): Promise<Agendamento[]> {
    const agora = new Date();
    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        usuarioId,
        status: { in: STATUS_AGENDAMENTO_ATIVO },
        OR: [
          { fimOcupacao: { gt: agora } },
          { fimOcupacao: null, data: { gt: agora } },
        ],
      },
      include: this.includeAgendamento(),
      orderBy: { data: 'asc' },
    } as any);

    return agendamentos.map((agendamento) => this.normalizarAgendamento(agendamento));
  }

  async buscarPorUsuario(usuarioId: number): Promise<Agendamento[]> {
    const agendamentos = await this.prisma.agendamento.findMany({
      where: { usuarioId },
      include: this.includeAgendamento(),
      orderBy: { data: 'desc' },
      take: 100,
    } as any);

    return agendamentos.map((agendamento) => this.normalizarAgendamento(agendamento));
  }

  async buscarPorProfissionalEData(
    profissional: number,
    data: Date,
    estabelecimentoId = DEFAULT_ESTABELECIMENTO_ID,
  ): Promise<Agendamento[]> {
    const ano = data.getFullYear();
    const mes = data.getUTCMonth();
    const dia = data.getUTCDate();

    const inicioDoDia = new Date(ano, mes, dia, 0, 0, 0);
    const fimDoDia = new Date(ano, mes, dia, 23, 59, 59);

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        estabelecimentoId,
        profissionalId: profissional,
        status: { in: STATUS_AGENDAMENTO_ATIVO },
        data: { gte: inicioDoDia, lte: fimDoDia },
      },
      include: this.includeAgendamento(),
    } as any);

    return agendamentos.map((agendamento) => this.normalizarAgendamento(agendamento));
  }

  async excluir(id: number): Promise<void> {
    throw new Error(`Cancelamento do agendamento ${id} exige usuário e estabelecimento`);
  }

  async buscarParaCancelar(id: number, usuarioId: number, estabelecimentoId: number | undefined, membroEstabelecimento: boolean) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: {
        id,
        ...(estabelecimentoId ? { estabelecimentoId } : {}),
        status: { in: ['AGENDADO', 'CONFIRMADO'] },
        ...(membroEstabelecimento ? {} : { usuarioId }),
      },
      select: { id: true, data: true, estabelecimentoId: true },
    });

    if (!agendamento) return null;

    if (agendamento.data.getTime() <= Date.now()) {
      throw new Error('Não é possível cancelar um horário que já passou');
    }

    return agendamento;
  }

  async avaliar(id: number, usuarioId: number, nota: number, comentario?: string) {
    const agendamento: any = await (this.prisma.agendamento as any).findFirst({
      where: { id, usuarioId },
      select: {
        id: true,
        estabelecimentoId: true,
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
        estabelecimentoId: agendamento.estabelecimentoId,
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
