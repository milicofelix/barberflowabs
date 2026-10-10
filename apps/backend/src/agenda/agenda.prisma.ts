import { Injectable } from '@nestjs/common';
import { AgendaUtils, TEMPO_SLOT } from '@barbabrutal/core';
import { PrismaService } from 'src/db/prisma.service';
import { ConfiguracaoAgendaDto, HorariosDisponiveisDto } from './agenda.dto';

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

    const [barbearia, horariosFuncionamento, escalasProfissional] = await Promise.all([
      this.prisma.barbearia.findUnique({
        where: { id: params.barbeariaId },
        select: { antecedenciaMinutos: true },
      }),
      this.prisma.horarioFuncionamento.findMany({
        where: {
          barbeariaId: params.barbeariaId,
          diaSemana,
          ativo: true,
          ...(params.unidadeId ? { unidadeId: params.unidadeId } : {}),
        },
        orderBy: { inicio: 'asc' },
      }),
      params.profissionalId
        ? (this.prisma as any).escalaProfissional.findMany({
          where: {
            barbeariaId: params.barbeariaId,
            profissionalId: params.profissionalId,
            diaSemana,
            ativo: true,
            OR: params.unidadeId ? [{ unidadeId: params.unidadeId }, { unidadeId: null }] : [{ unidadeId: null }],
          },
          orderBy: { inicio: 'asc' },
        })
        : Promise.resolve([]),
    ]);

    const possuiEscalaConfigurada = params.profissionalId
      ? await (this.prisma as any).escalaProfissional.count({
        where: { barbeariaId: params.barbeariaId, profissionalId: params.profissionalId, ativo: true },
      }) > 0
      : false;
    const periodos = possuiEscalaConfigurada ? escalasProfissional : horariosFuncionamento;

    if (periodos.length === 0) {
      if (possuiEscalaConfigurada) return { manha: [], tardeNoite: [] };
      return this.removerHorariosSemAntecedencia(
        AgendaUtils.horariosDoDia(),
        params.data,
        barbearia?.antecedenciaMinutos ?? 30,
      );
    }

    const horarios = periodos.flatMap((horario) =>
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

    return this.removerHorariosSemAntecedencia({
      manha: horariosDisponiveis.filter((horario) => horario < '12:00'),
      tardeNoite: horariosDisponiveis.filter((horario) => horario >= '12:00'),
    }, params.data, barbearia?.antecedenciaMinutos ?? 30);
  }

  async buscarConfiguracao(barbeariaId: number): Promise<ConfiguracaoAgendaDto> {
    const [barbearia, horarios] = await Promise.all([
      this.prisma.barbearia.findUnique({
        where: { id: barbeariaId },
        select: { antecedenciaMinutos: true },
      }),
      this.prisma.horarioFuncionamento.findMany({
        where: { barbeariaId, unidadeId: null },
        orderBy: [{ diaSemana: 'asc' }, { inicio: 'asc' }],
      }),
    ]);

    return {
      antecedenciaMinutos: barbearia?.antecedenciaMinutos ?? 30,
      horarios,
    };
  }

  async salvarConfiguracao(barbeariaId: number, configuracao: ConfiguracaoAgendaDto) {
    await this.prisma.$transaction([
      this.prisma.barbearia.update({
        where: { id: barbeariaId },
        data: { antecedenciaMinutos: configuracao.antecedenciaMinutos },
      }),
      this.prisma.horarioFuncionamento.deleteMany({
        where: { barbeariaId, unidadeId: null },
      }),
      this.prisma.horarioFuncionamento.createMany({
        data: configuracao.horarios.map((horario) => ({
          barbeariaId,
          diaSemana: horario.diaSemana,
          inicio: horario.inicio,
          fim: horario.fim,
          intervaloInicio: horario.intervaloInicio || null,
          intervaloFim: horario.intervaloFim || null,
          ativo: horario.ativo ?? true,
        })),
      }),
    ]);

    return this.buscarConfiguracao(barbeariaId);
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

  private removerHorariosSemAntecedencia(
    horarios: HorariosDisponiveisDto,
    data: string,
    antecedenciaMinutos: number,
  ): HorariosDisponiveisDto {
    const hoje = this.obterHojeLocal();

    if (data < hoje.data) {
      return { manha: [], tardeNoite: [] };
    }

    if (data > hoje.data) {
      return horarios;
    }

    const limite = hoje.minutos + antecedenciaMinutos;
    return {
      manha: horarios.manha.filter((horario) => this.horarioParaMinutos(horario) >= limite),
      tardeNoite: horarios.tardeNoite.filter(
        (horario) => this.horarioParaMinutos(horario) >= limite,
      ),
    };
  }

  private obterHojeLocal() {
    const partes = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());

    const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? '00';
    return {
      data: `${valor('year')}-${valor('month')}-${valor('day')}`,
      minutos: Number(valor('hour')) * 60 + Number(valor('minute')),
    };
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
