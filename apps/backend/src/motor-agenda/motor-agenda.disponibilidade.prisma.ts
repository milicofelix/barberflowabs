import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { ConflitoAgendaError } from './conflito-agenda.error';
import { PeriodoAgenda } from './motor-agenda.calculador';
import { ContextoAgenda } from './motor-agenda.dto';

const STATUS_ATIVOS = ['AGENDADO', 'CONFIRMADO', 'CHECKIN'];

export interface AlocacaoRecurso {
  recursoId: number;
  quantidade: number;
}

@Injectable()
export class MotorAgendaDisponibilidadePrisma {
  constructor(private readonly prisma: PrismaService) {}

  consultar(contexto: ContextoAgenda, periodo: PeriodoAgenda, agendamentoIgnoradoId?: number) {
    return this.verificar(this.prisma as any, contexto, periodo, agendamentoIgnoradoId);
  }

  async verificar(
    cliente: any,
    contexto: ContextoAgenda,
    periodo: PeriodoAgenda,
    agendamentoIgnoradoId?: number,
  ) {
    await this.verificarProfissional(cliente, contexto, periodo, agendamentoIgnoradoId);
    await this.verificarBloqueio(cliente, contexto, periodo);
    return this.alocarRecursos(cliente, contexto, periodo, agendamentoIgnoradoId);
  }

  private async verificarProfissional(
    cliente: any,
    contexto: ContextoAgenda,
    periodo: PeriodoAgenda,
    agendamentoIgnoradoId?: number,
  ) {
    const conflito = await cliente.agendamento.findFirst({
      where: {
        barbeariaId: contexto.barbeariaId,
        profissionalId: contexto.profissionalId,
        status: { in: STATUS_ATIVOS },
        inicioOcupacao: { lt: periodo.fimOcupacao },
        fimOcupacao: { gt: periodo.inicioOcupacao },
        ...(agendamentoIgnoradoId ? { id: { not: agendamentoIgnoradoId } } : {}),
      },
      select: { id: true },
    });
    if (conflito) throw new ConflitoAgendaError('Profissional indisponível nesse período');
  }

  private async verificarBloqueio(cliente: any, contexto: ContextoAgenda, periodo: PeriodoAgenda) {
    const bloqueio = await cliente.bloqueioAgenda.findFirst({
      where: {
        barbeariaId: contexto.barbeariaId,
        inicio: { lt: periodo.fimOcupacao },
        fim: { gt: periodo.inicioOcupacao },
        AND: [
          { OR: [{ profissionalId: null }, { profissionalId: contexto.profissionalId }] },
          contexto.unidadeId ? { OR: [{ unidadeId: null }, { unidadeId: contexto.unidadeId }] } : {},
        ],
      },
      select: { id: true },
    });
    if (bloqueio) throw new ConflitoAgendaError('Período bloqueado na agenda');
  }

  private async alocarRecursos(
    cliente: any,
    contexto: ContextoAgenda,
    periodo: PeriodoAgenda,
    agendamentoIgnoradoId?: number,
  ): Promise<AlocacaoRecurso[]> {
    const necessidades = this.agruparNecessidades(contexto);
    if (!necessidades.size) return [];
    const recursos = await cliente.recurso.findMany({
      where: {
        barbeariaId: contexto.barbeariaId,
        tipo: { in: [...necessidades.keys()] },
        ativo: true,
        ...(contexto.unidadeId
          ? { OR: [{ unidadeId: contexto.unidadeId }, { unidadeId: null }] }
          : { unidadeId: null }),
      },
      include: {
        reservas: {
          where: {
            inicio: { lt: periodo.fimOcupacao },
            fim: { gt: periodo.inicioOcupacao },
            agendamento: {
              status: { in: STATUS_ATIVOS },
              ...(agendamentoIgnoradoId ? { id: { not: agendamentoIgnoradoId } } : {}),
            },
          },
          select: { quantidade: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    const alocacoes: AlocacaoRecurso[] = [];
    for (const [tipo, quantidade] of necessidades) {
      let restante = quantidade;
      for (const recurso of recursos.filter((item) => item.tipo === tipo)) {
        const ocupado = recurso.reservas.reduce((total, reserva) => total + reserva.quantidade, 0);
        const alocado = Math.min(restante, Math.max(0, recurso.capacidade - ocupado));
        if (alocado > 0) alocacoes.push({ recursoId: recurso.id, quantidade: alocado });
        restante -= alocado;
        if (restante === 0) break;
      }
      if (restante > 0) throw new ConflitoAgendaError(`Recurso do tipo ${tipo} indisponível`);
    }
    return alocacoes;
  }

  private agruparNecessidades(contexto: ContextoAgenda) {
    const necessidades = new Map<string, number>();
    contexto.servicos.forEach((servico) => {
      servico.recursosNecessarios?.forEach((requisito) => {
        const quantidade = Math.max(necessidades.get(requisito.tipoRecurso) ?? 0, requisito.quantidade);
        necessidades.set(requisito.tipoRecurso, quantidade);
      });
    });
    return necessidades;
  }
}
