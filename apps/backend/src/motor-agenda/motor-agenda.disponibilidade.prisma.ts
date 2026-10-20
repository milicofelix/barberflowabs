import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { ConflitoAgendaError } from './conflito-agenda.error';
import { PeriodoAgenda } from './motor-agenda.calculador';
import { ContextoAgenda } from './motor-agenda.dto';

const STATUS_ATIVOS = ['AGENDADO', 'CONFIRMADO', 'ATRASADO', 'CHECKIN'];

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
    await this.verificarEscala(cliente, contexto, periodo);
    await this.verificarProfissional(cliente, contexto, periodo, agendamentoIgnoradoId);
    await this.verificarBloqueio(cliente, contexto, periodo);
    return this.alocarRecursos(cliente, contexto, periodo, agendamentoIgnoradoId);
  }

  private async verificarEscala(cliente: any, contexto: ContextoAgenda, periodo: PeriodoAgenda) {
    const total = await cliente.escalaProfissional.count({
      where: { estabelecimentoId: contexto.estabelecimentoId, profissionalId: contexto.profissionalId, ativo: true },
    });
    if (!total) return;
    const local = this.periodoLocal(periodo);
    const escalas = await cliente.escalaProfissional.findMany({
      where: {
        estabelecimentoId: contexto.estabelecimentoId,
        profissionalId: contexto.profissionalId,
        diaSemana: local.diaSemana,
        ativo: true,
        OR: contexto.unidadeId ? [{ unidadeId: contexto.unidadeId }, { unidadeId: null }] : [{ unidadeId: null }],
      },
    });
    const dentroDaEscala = escalas.some((escala) => {
      const cruzaIntervalo = escala.intervaloInicio && escala.intervaloFim
        && local.inicio < escala.intervaloFim && local.fim > escala.intervaloInicio;
      return local.inicio >= escala.inicio && local.fim <= escala.fim && !cruzaIntervalo;
    });
    if (!dentroDaEscala) throw new ConflitoAgendaError('Profissional fora da escala nesse período');
  }

  private async verificarProfissional(
    cliente: any,
    contexto: ContextoAgenda,
    periodo: PeriodoAgenda,
    agendamentoIgnoradoId?: number,
  ) {
    const conflito = await cliente.agendamento.findFirst({
      where: {
        estabelecimentoId: contexto.estabelecimentoId,
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
        estabelecimentoId: contexto.estabelecimentoId,
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
        estabelecimentoId: contexto.estabelecimentoId,
        tipo: { in: [...necessidades.keys()] },
        ativo: true,
        ...(contexto.unidadeId
          ? { OR: [{ unidadeId: contexto.unidadeId }, { unidadeId: null }] }
          : { unidadeId: null }),
      },
      include: {
        indisponibilidades: {
          where: { ativo: true, inicio: { lt: periodo.fimOcupacao }, fim: { gt: periodo.inicioOcupacao } },
          select: { id: true },
        },
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
        if (recurso.indisponibilidades.length) continue;
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

  private periodoLocal(periodo: PeriodoAgenda) {
    const formatar = (data: Date) => new Intl.DateTimeFormat('pt-BR', {
      timeZone: process.env.APP_TIME_ZONE ?? 'America/Sao_Paulo',
      weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(data);
    const partesInicio = formatar(periodo.inicioOcupacao);
    const partesFim = formatar(periodo.fimOcupacao);
    const valor = (partes: Intl.DateTimeFormatPart[], tipo: string) => partes.find((item) => item.type === tipo)?.value ?? '00';
    const dias: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sáb: 6, sab: 6 };
    return {
      diaSemana: dias[valor(partesInicio, 'weekday').replace('.', '').toLowerCase()],
      inicio: `${valor(partesInicio, 'hour')}:${valor(partesInicio, 'minute')}`,
      fim: `${valor(partesFim, 'hour')}:${valor(partesFim, 'minute')}`,
    };
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
