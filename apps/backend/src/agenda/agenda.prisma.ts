import { Injectable } from '@nestjs/common';
import { AgendaUtils, TEMPO_SLOT } from '@barbabrutal/core';
import { PrismaService } from 'src/db/prisma.service';
import { HorariosDisponiveisDto } from './agenda.dto';

@Injectable()
export class AgendaPrisma {
  constructor(private readonly prisma: PrismaService) {}

  async buscarHorariosDisponiveis(params: {
    barbeariaId: number;
    data: string;
    profissionalId?: number;
    unidadeId?: number;
  }): Promise<HorariosDisponiveisDto> {
    const dataReferencia = this.criarDataReferencia(params.data);
    const diaSemana = dataReferencia.getUTCDay();

    const horariosFuncionamento = await this.prisma.horarioFuncionamento.findMany({
      where: {
        barbeariaId: params.barbeariaId,
        diaSemana,
        ativo: true,
        ...(params.unidadeId ? { unidadeId: params.unidadeId } : {}),
      },
      orderBy: { inicio: 'asc' },
    });

    if (horariosFuncionamento.length === 0) {
      return AgendaUtils.horariosDoDia();
    }

    const horarios = horariosFuncionamento.flatMap((horario) =>
      this.gerarSlots({
        inicio: horario.inicio,
        fim: horario.fim,
        intervaloInicio: horario.intervaloInicio,
        intervaloFim: horario.intervaloFim,
      }),
    );

    const bloqueios = await this.prisma.bloqueioAgenda.findMany({
      where: {
        barbeariaId: params.barbeariaId,
        inicio: { lt: this.comporDataHora(params.data, '23:59') },
        fim: { gt: this.comporDataHora(params.data, '00:00') },
        AND: [
          params.profissionalId
            ? { OR: [{ profissionalId: null }, { profissionalId: params.profissionalId }] }
            : {},
          params.unidadeId ? { OR: [{ unidadeId: null }, { unidadeId: params.unidadeId }] } : {},
        ],
      },
    });

    const horariosDisponiveis = horarios.filter((horario) => {
      const inicioSlot = this.comporDataHora(params.data, horario);
      const fimSlot = new Date(inicioSlot.getTime() + TEMPO_SLOT * 60000);
      return !bloqueios.some((bloqueio) => inicioSlot < bloqueio.fim && fimSlot > bloqueio.inicio);
    });

    return {
      manha: horariosDisponiveis.filter((horario) => horario < '12:00'),
      tardeNoite: horariosDisponiveis.filter((horario) => horario >= '12:00'),
    };
  }

  private gerarSlots(params: {
    inicio: string;
    fim: string;
    intervaloInicio?: string | null;
    intervaloFim?: string | null;
  }) {
    const horarios: string[] = [];
    const fimEmMinutos = this.horarioParaMinutos(params.fim);
    let cursor = this.horarioParaMinutos(params.inicio);

    while (cursor < fimEmMinutos) {
      const horario = this.minutosParaHorario(cursor);
      const dentroDoIntervalo =
        params.intervaloInicio &&
        params.intervaloFim &&
        horario >= params.intervaloInicio &&
        horario < params.intervaloFim;

      if (!dentroDoIntervalo) {
        horarios.push(horario);
      }

      cursor += TEMPO_SLOT;
    }

    return horarios;
  }

  private criarDataReferencia(data: string) {
    return new Date(`${data}T12:00:00.000Z`);
  }

  private comporDataHora(data: string, horario: string) {
    return new Date(`${data}T${horario}:00.000Z`);
  }

  private horarioParaMinutos(horario: string) {
    const [horas, minutos] = horario.split(':').map(Number);
    return horas * 60 + minutos;
  }

  private minutosParaHorario(total: number) {
    const horas = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const minutos = (total % 60).toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  }
}
