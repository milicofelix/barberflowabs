import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import Agendamento from '@barbabrutal/core/src/agendamento/model/Agendamento';
import RepositorioAgendamento from '@barbabrutal/core/src/agendamento/provider/RepositorioAgendamento';
import { DEFAULT_BARBEARIA_ID } from 'src/shared/tenant';

@Injectable()
export class AgendamentoPrisma implements RepositorioAgendamento {
  constructor(private readonly prisma: PrismaService) {}

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

    await this.prisma.agendamento.create({
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
  }

  async buscarPorId(id: number): Promise<Agendamento | null> {
    const agendamento = await this.prisma.agendamento.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, barbeariaId: true, nome: true, email: true } },
        profissional: { select: { id: true, nome: true } },
        servicos: {
          select: { id: true, nome: true, preco: true, qtdeSlots: true },
        },
      },
    });

    return agendamento ? this.normalizarAgendamento(agendamento) : null;
  }

  async buscarPorEmail(email: string, barbeariaId?: number): Promise<Agendamento[]> {
    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        usuario: { email },
        ...(barbeariaId ? { barbeariaId } : {}),
        data: { gte: new Date() },
      },
      include: {
        usuario: { select: { id: true, barbeariaId: true, nome: true, email: true } },
        profissional: { select: { id: true, nome: true } },
        servicos: {
          select: { id: true, nome: true, preco: true, qtdeSlots: true },
        },
      },
      orderBy: { data: 'desc' },
    });

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
        data: { gte: inicioDoDia, lte: fimDoDia },
      },
      include: {
        usuario: { select: { id: true, barbeariaId: true, nome: true, email: true } },
        profissional: { select: { id: true, nome: true } },
        servicos: {
          select: { id: true, nome: true, preco: true, qtdeSlots: true },
        },
      },
    });

    return agendamentos.map((agendamento) => this.normalizarAgendamento(agendamento));
  }

  async excluir(id: number): Promise<void> {
    await this.prisma.agendamento.delete({
      where: { id },
      include: { servicos: true },
    });
  }
}
