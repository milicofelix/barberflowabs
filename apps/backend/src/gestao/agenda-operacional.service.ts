import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { ConsultarAgendaPeriodoDto } from './gestao.dto';

const STATUS_VALIDOS = new Set([
  'AGENDADO',
  'CONFIRMADO',
  'CHECKIN',
  'CONCLUIDO',
  'CANCELADO',
  'NO_SHOW',
]);
const LIMITE_PADRAO = 100;
const LIMITE_MAXIMO = 200;
const JANELA_MAXIMA_DIAS = 31;

interface CursorAgenda {
  data: string;
  id: number;
}

@Injectable()
export class AgendaOperacionalService {
  constructor(private readonly prisma: PrismaService) {}

  async consultar(estabelecimentoId: number, consulta: ConsultarAgendaPeriodoDto) {
    const inicio = this.dataHora(consulta.inicio, 'Início');
    const fim = this.dataHora(consulta.fim, 'Fim');
    if (fim <= inicio) throw new BadRequestException('Fim deve ser posterior ao início');
    if (fim.getTime() - inicio.getTime() > JANELA_MAXIMA_DIAS * 86_400_000) {
      throw new BadRequestException(`O período máximo da consulta é de ${JANELA_MAXIMA_DIAS} dias`);
    }

    const filtros = this.normalizarFiltros(consulta);
    const cursor = this.decodificarCursor(consulta.cursor);
    const limite = this.limite(consulta.limite);
    const estabelecimento = await (this.prisma as any).estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      select: { fusoHorario: true },
    });
    const fusoHorario = estabelecimento?.fusoHorario ?? process.env.APP_TIME_ZONE ?? 'America/Sao_Paulo';

    const [agendamentos, bloqueios, indisponibilidadesRecursos] = await Promise.all([
      (this.prisma as any).agendamento.findMany({
      where: {
        estabelecimentoId,
        AND: [
          {
            OR: [
              { inicioOcupacao: { lt: fim }, fimOcupacao: { gt: inicio } },
              { inicioOcupacao: null, data: { gte: inicio, lt: fim } },
            ],
          },
          ...(cursor ? [{ OR: [{ data: { gt: new Date(cursor.data) } }, { data: new Date(cursor.data), id: { gt: cursor.id } }] }] : []),
        ],
        ...(filtros.unidadeId ? { unidadeId: filtros.unidadeId } : {}),
        ...(filtros.profissionalId ? { profissionalId: filtros.profissionalId } : {}),
        ...(filtros.servicoId ? { servicos: { some: { id: filtros.servicoId } } } : {}),
        ...(filtros.recursoId ? { recursos: { some: { recursoId: filtros.recursoId } } } : {}),
        ...(filtros.status.length ? { status: { in: filtros.status } } : {}),
      },
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true } },
        criadoPor: { select: { id: true, nome: true } },
        profissional: { select: { id: true, nome: true } },
        unidade: { select: { id: true, nome: true } },
        servicos: { select: { id: true, nome: true, preco: true, qtdeSlots: true } },
        itens: { include: { servico: { select: { id: true, nome: true } } }, orderBy: { ordem: 'asc' } },
        recursos: { include: { recurso: { select: { id: true, nome: true, tipo: true } } } },
      },
      orderBy: [{ data: 'asc' }, { id: 'asc' }],
      take: limite + 1,
      }),
      (this.prisma as any).bloqueioAgenda.findMany({
        where: {
          estabelecimentoId,
          inicio: { lt: fim },
          fim: { gt: inicio },
          ...(filtros.unidadeId ? { OR: [{ unidadeId: null }, { unidadeId: filtros.unidadeId }] } : {}),
          ...(filtros.profissionalId ? { OR: [{ profissionalId: null }, { profissionalId: filtros.profissionalId }] } : {}),
        },
        include: {
          profissional: { select: { id: true, nome: true } },
          unidade: { select: { id: true, nome: true } },
        },
        orderBy: { inicio: 'asc' },
      }),
      (this.prisma as any).indisponibilidadeRecurso.findMany({
        where: {
          estabelecimentoId,
          ativo: true,
          inicio: { lt: fim },
          fim: { gt: inicio },
          ...(filtros.recursoId ? { recursoId: filtros.recursoId } : {}),
        },
        include: { recurso: { select: { id: true, nome: true, tipo: true } } },
        orderBy: { inicio: 'asc' },
      }),
    ]);

    const temMais = agendamentos.length > limite;
    const itens = agendamentos.slice(0, limite).map((agendamento: any) => this.normalizar(agendamento));
    const ultimo = temMais ? itens[itens.length - 1] : null;

    return {
      periodo: { inicio: inicio.toISOString(), fim: fim.toISOString(), fusoHorario, convencao: '[inicio,fim)' },
      filtros,
      pagina: {
        limite,
        temMais,
        proximoCursor: ultimo ? this.codificarCursor({ data: ultimo.data, id: ultimo.id }) : null,
      },
      itens,
      restricoes: [
        ...bloqueios.map((item: any) => ({
          id: `bloqueio:${item.id}`,
          tipo: 'BLOQUEIO',
          inicio: item.inicio.toISOString(),
          fim: item.fim.toISOString(),
          motivo: item.motivo ?? 'Agenda bloqueada',
          profissional: item.profissional,
          unidade: item.unidade,
          recurso: null,
        })),
        ...indisponibilidadesRecursos.map((item: any) => ({
          id: `recurso:${item.id}`,
          tipo: 'RECURSO_INDISPONIVEL',
          inicio: item.inicio.toISOString(),
          fim: item.fim.toISOString(),
          motivo: item.motivo ?? 'Recurso indisponível',
          profissional: null,
          unidade: null,
          recurso: item.recurso,
        })),
      ],
    };
  }

  private normalizar(agendamento: any) {
    const inicioAtendimento = new Date(agendamento.data);
    const fimAtendimento = agendamento.dataFim
      ? new Date(agendamento.dataFim)
      : this.adicionarMinutos(inicioAtendimento, this.duracaoLegada(agendamento));
    const primeiroItem = agendamento.itens?.[0];
    const ultimoItem = agendamento.itens?.[agendamento.itens.length - 1];
    const preparoAntes = Math.max(0, primeiroItem?.preparoAntesMinutos ?? 0);
    const preparoDepois = Math.max(0, ultimoItem?.preparoDepoisMinutos ?? 0);
    const deslocamento = Math.max(0, agendamento.deslocamentoMinutos ?? 0);
    const inicioPreparacao = this.adicionarMinutos(inicioAtendimento, -preparoAntes);
    const fimPreparacao = this.adicionarMinutos(fimAtendimento, preparoDepois);

    return {
      ...agendamento,
      valorTotal: this.valorTotal(agendamento),
      servicos: agendamento.servicos.map((servico: any) => ({ ...servico, preco: Number(servico.preco) })),
      itens: agendamento.itens.map((item: any) => ({ ...item, preco: Number(item.preco) })),
      periodos: {
        ocupacao: this.periodo(agendamento.inicioOcupacao ?? inicioAtendimento, agendamento.fimOcupacao ?? fimAtendimento),
        deslocamentoAntes: deslocamento ? this.periodo(this.adicionarMinutos(inicioPreparacao, -deslocamento), inicioPreparacao) : null,
        preparacaoAntes: preparoAntes ? this.periodo(inicioPreparacao, inicioAtendimento) : null,
        atendimento: this.periodo(inicioAtendimento, fimAtendimento),
        preparacaoDepois: preparoDepois ? this.periodo(fimAtendimento, fimPreparacao) : null,
        deslocamentoDepois: deslocamento ? this.periodo(fimPreparacao, this.adicionarMinutos(fimPreparacao, deslocamento)) : null,
      },
    };
  }

  private duracaoLegada(agendamento: any) {
    if (agendamento.itens?.length) {
      const servicos = agendamento.itens.reduce(
        (total: number, item: any) => total + Math.max(0, item.duracaoMinutos ?? 0),
        0,
      );
      const transicoes = agendamento.itens.slice(1).reduce((total: number, item: any, indice: number) => {
        const anterior = agendamento.itens[indice];
        return total + Math.max(anterior.preparoDepoisMinutos ?? 0, item.preparoAntesMinutos ?? 0);
      }, 0);
      return servicos + transicoes;
    }
    return Math.max(15, agendamento.servicos.reduce(
      (total: number, servico: any) => total + Math.max(1, servico.qtdeSlots ?? 1) * 15,
      0,
    ));
  }

  private valorTotal(agendamento: any) {
    const persistido = Number(agendamento.valorTotal ?? 0);
    if (persistido > 0) return persistido;
    return agendamento.servicos.reduce(
      (total: number, servico: any) => total + Number(servico.preco),
      0,
    );
  }

  private normalizarFiltros(consulta: ConsultarAgendaPeriodoDto) {
    const status = (consulta.status ?? '').split(',').map((item) => item.trim().toUpperCase()).filter(Boolean);
    const invalido = status.find((item) => !STATUS_VALIDOS.has(item));
    if (invalido) throw new BadRequestException(`Status inválido: ${invalido}`);
    return {
      unidadeId: this.idOpcional(consulta.unidadeId, 'Unidade'),
      profissionalId: this.idOpcional(consulta.profissionalId, 'Profissional'),
      recursoId: this.idOpcional(consulta.recursoId, 'Recurso'),
      servicoId: this.idOpcional(consulta.servicoId, 'Serviço'),
      status,
    };
  }

  private idOpcional(valor: string | undefined, campo: string) {
    if (!valor) return null;
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException(`${campo} inválido`);
    return id;
  }

  private dataHora(valor: string, campo: string) {
    if (!valor || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(valor)) {
      throw new BadRequestException(`${campo} deve usar data e hora ISO 8601 com fuso horário`);
    }
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) throw new BadRequestException(`${campo} inválido`);
    return data;
  }

  private limite(valor?: string) {
    if (!valor) return LIMITE_PADRAO;
    const limite = Number(valor);
    if (!Number.isInteger(limite) || limite <= 0 || limite > LIMITE_MAXIMO) {
      throw new BadRequestException(`Limite deve estar entre 1 e ${LIMITE_MAXIMO}`);
    }
    return limite;
  }

  private codificarCursor(cursor: CursorAgenda) {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  private decodificarCursor(valor?: string): CursorAgenda | null {
    if (!valor) return null;
    try {
      const cursor = JSON.parse(Buffer.from(valor, 'base64url').toString('utf8')) as CursorAgenda;
      if (!Number.isInteger(cursor.id) || Number.isNaN(new Date(cursor.data).getTime())) throw new Error();
      return cursor;
    } catch {
      throw new BadRequestException('Cursor de paginação inválido');
    }
  }

  private periodo(inicio: Date | string, fim: Date | string) {
    return { inicio: new Date(inicio).toISOString(), fim: new Date(fim).toISOString() };
  }

  private adicionarMinutos(data: Date, minutos: number) {
    return new Date(data.getTime() + minutos * 60_000);
  }
}
