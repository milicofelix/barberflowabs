import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { ModeloAtendimento } from 'src/estabelecimento/estabelecimento.constants';
import { ContextoAgenda, ServicoAgenda } from './motor-agenda.dto';

@Injectable()
export class MotorAgendaConsultaPrisma {
  constructor(private readonly prisma: PrismaService) {}

  async carregarContexto(params: {
    barbeariaId: number;
    profissionalId: number;
    servicoIds: number[];
    unidadeId?: number | null;
    modeloAtendimento?: ModeloAtendimento;
  }): Promise<ContextoAgenda> {
    const cliente = this.prisma as any;
    const [estabelecimento, profissional, servicosEncontrados] = await Promise.all([
      cliente.barbearia.findUnique({
        where: { id: params.barbeariaId },
        select: { modeloAtendimento: true },
      }),
      cliente.profissional.findFirst({
        where: { id: params.profissionalId, barbeariaId: params.barbeariaId },
        select: { id: true },
      }),
      cliente.servico.findMany({
        where: { id: { in: params.servicoIds }, barbeariaId: params.barbeariaId },
        include: {
          profissionaisHabilitados: {
            where: { profissionalId: params.profissionalId, ativo: true },
            select: { profissionalId: true, ativo: true },
          },
          recursosNecessarios: true,
        },
      }),
    ]);

    if (!estabelecimento) throw new NotFoundException('Estabelecimento não encontrado');
    if (!profissional) throw new NotFoundException('Profissional não encontrado');
    if (servicosEncontrados.length !== params.servicoIds.length) {
      throw new BadRequestException('Um ou mais serviços não pertencem ao estabelecimento');
    }

    const modelo = params.modeloAtendimento ?? this.modeloPadrao(estabelecimento.modeloAtendimento);
    const unidadeId = await this.resolverUnidade(params.barbeariaId, params.unidadeId, modelo);
    const porId = new Map<number, ServicoAgenda>(
      (servicosEncontrados as ServicoAgenda[]).map((servico) => [servico.id, servico]),
    );

    return {
      barbeariaId: params.barbeariaId,
      modeloEstabelecimento: estabelecimento.modeloAtendimento,
      modeloAtendimento: modelo,
      profissionalId: params.profissionalId,
      unidadeId,
      servicos: params.servicoIds.map((id) => porId.get(id)!),
    };
  }

  async obterParaReagendar(id: number, barbeariaId: number) {
    const agendamento = await (this.prisma as any).agendamento.findFirst({
      where: { id, barbeariaId },
      include: {
        itens: {
          orderBy: { ordem: 'asc' },
          include: {
            servico: {
              include: {
                profissionaisHabilitados: { where: { ativo: true } },
                recursosNecessarios: true,
              },
            },
          },
        },
      },
    });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado');
    return agendamento;
  }

  async validarHorarioFuncionamento(
    barbeariaId: number,
    unidadeId: number | null,
    inicio: Date,
    fim: Date,
  ) {
    const inicioLocal = this.obterPartesLocais(inicio);
    const fimLocal = this.obterPartesLocais(fim);
    const horarios = await this.prisma.horarioFuncionamento.findMany({
      where: {
        barbeariaId,
        diaSemana: inicioLocal.diaSemana,
        ativo: true,
        OR: unidadeId ? [{ unidadeId }, { unidadeId: null }] : [{ unidadeId: null }],
      },
    });
    if (!horarios.length) return;

    if (inicioLocal.data !== fimLocal.data) {
      throw new BadRequestException('O período ocupado não pode atravessar dias diferentes');
    }
    const inicioMinutos = inicioLocal.minutos;
    const fimMinutos = fimLocal.minutos;
    const disponivel = horarios.some((horario) => {
      const abre = this.paraMinutos(horario.inicio);
      const fecha = this.paraMinutos(horario.fim);
      const cruzaIntervalo = horario.intervaloInicio && horario.intervaloFim
        && inicioMinutos < this.paraMinutos(horario.intervaloFim)
        && fimMinutos > this.paraMinutos(horario.intervaloInicio);
      return inicioMinutos >= abre && fimMinutos <= fecha && !cruzaIntervalo;
    });
    if (!disponivel) throw new BadRequestException('Período fora do horário de funcionamento');
  }

  private async resolverUnidade(
    barbeariaId: number,
    unidadeId: number | null | undefined,
    modelo: ModeloAtendimento,
  ) {
    if (modelo === 'DOMICILIAR') return null;
    const unidade = await this.prisma.unidade.findFirst({
      where: { barbeariaId, ativa: true, ...(unidadeId ? { id: unidadeId } : {}) },
      orderBy: { id: 'asc' },
      select: { id: true },
    });
    if (!unidade) throw new BadRequestException('Unidade inválida ou não configurada');
    return unidade.id;
  }

  private modeloPadrao(modelo: ModeloAtendimento): ModeloAtendimento {
    return modelo === 'HIBRIDO' ? 'PRESENCIAL' : modelo;
  }

  private paraMinutos(horario: string) {
    const [hora, minuto] = horario.split(':').map(Number);
    return hora * 60 + minuto;
  }

  private obterPartesLocais(data: Date) {
    const partes = new Intl.DateTimeFormat('pt-BR', {
      timeZone: process.env.APP_TIME_ZONE ?? 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(data);
    const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? '00';
    const ano = Number(valor('year'));
    const mes = Number(valor('month'));
    const dia = Number(valor('day'));
    return {
      data: `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
      diaSemana: new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay(),
      minutos: Number(valor('hour')) * 60 + Number(valor('minute')),
    };
  }
}
