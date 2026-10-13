import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { AuditoriaCriacaoAgendamento, ContextoAgenda } from './motor-agenda.dto';
import { PeriodoAgenda } from './motor-agenda.calculador';
import {
  AlocacaoRecurso,
  MotorAgendaDisponibilidadePrisma,
} from './motor-agenda.disponibilidade.prisma';
import { ConflitoAgendaError } from './conflito-agenda.error';

const STATUS_AGENDAMENTO_ATIVO = ['AGENDADO', 'CONFIRMADO', 'CHECKIN'];

@Injectable()
export class MotorAgendaComandoPrisma {
  constructor(
    private readonly prisma: PrismaService,
    private readonly disponibilidade: MotorAgendaDisponibilidadePrisma,
  ) {}

  criar(params: {
    contexto: ContextoAgenda;
    periodo: PeriodoAgenda;
    usuarioId: number;
    enderecoAtendimento?: string | null;
    auditoria: AuditoriaCriacaoAgendamento;
  }) {
    return this.prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      await this.validarAgendaDoCliente(tx, params.usuarioId, params.contexto);
      await this.bloquearAgenda(tx, params.contexto);
      const recursos = await this.disponibilidade.verificar(tx, params.contexto, params.periodo);
      const agendamento = await tx.agendamento.create({
        data: this.dadosCriacao(params, recursos),
        include: this.inclusoesAgendamento(),
      });
      await this.atualizarRelacionamentoCliente(tx, params);
      return agendamento;
    });
  }

  reagendar(params: {
    agendamento: any;
    contexto: ContextoAgenda;
    periodo: PeriodoAgenda;
    alteradoPorId: number;
    enderecoAtendimento?: string | null;
    motivo?: string | null;
  }) {
    return this.prisma.$transaction(async (transacao) => {
      const tx = transacao as any;
      await tx.$queryRawUnsafe('SELECT id FROM agendamentos WHERE id = ? FOR UPDATE', params.agendamento.id);
      await this.bloquearAgenda(tx, params.contexto);
      const recursos = await this.disponibilidade.verificar(
        tx,
        params.contexto,
        params.periodo,
        params.agendamento.id,
      );
      await tx.agendamentoRecurso.deleteMany({ where: { agendamentoId: params.agendamento.id } });
      await tx.historicoReagendamento.create({ data: this.dadosHistorico(params) });
      return tx.agendamento.update({
        where: { id: params.agendamento.id },
        data: {
          data: params.periodo.data,
          dataFim: params.periodo.dataFim,
          inicioOcupacao: params.periodo.inicioOcupacao,
          fimOcupacao: params.periodo.fimOcupacao,
          unidadeId: params.contexto.unidadeId,
          enderecoAtendimento: params.enderecoAtendimento?.trim() || null,
          deslocamentoMinutos: params.periodo.deslocamentoMinutos,
          reagendadoEm: new Date(),
          recursos: { create: this.dadosRecursos(recursos, params.periodo) },
        },
        include: this.inclusoesAgendamento(),
      });
    });
  }

  private async bloquearAgenda(cliente: any, contexto: ContextoAgenda) {
    await cliente.$queryRawUnsafe(
      'SELECT id FROM profissionais WHERE id = ? AND estabelecimentoId = ? FOR UPDATE',
      contexto.profissionalId,
      contexto.estabelecimentoId,
    );
    await cliente.$queryRawUnsafe(
      'SELECT id FROM recursos WHERE estabelecimentoId = ? AND ativo = true FOR UPDATE',
      contexto.estabelecimentoId,
    );
  }

  private async validarAgendaDoCliente(
    cliente: any,
    usuarioId: number,
    contexto: ContextoAgenda,
  ) {
    await cliente.$queryRawUnsafe(
      'SELECT id FROM usuarios WHERE id = ? FOR UPDATE',
      usuarioId,
    );

    const agora = new Date();
    const agendamentoAtivo = await cliente.agendamento.findFirst({
      where: {
        usuarioId,
        estabelecimentoId: contexto.estabelecimentoId,
        unidadeId: contexto.unidadeId,
        status: { in: STATUS_AGENDAMENTO_ATIVO },
        OR: [
          { fimOcupacao: { gt: agora } },
          { fimOcupacao: null, data: { gt: agora } },
        ],
      },
      select: { id: true },
    });

    if (agendamentoAtivo) {
      throw new ConflitoAgendaError(
        'Você já possui um agendamento ativo nesta unidade. Cancele o anterior antes de criar outro nesta unidade.',
      );
    }
  }

  private dadosCriacao(params: any, recursos: AlocacaoRecurso[]) {
    const { contexto, periodo } = params;
    return {
      estabelecimentoId: contexto.estabelecimentoId,
      usuarioId: params.usuarioId,
      profissionalId: contexto.profissionalId,
      unidadeId: contexto.unidadeId,
      data: periodo.data,
      dataFim: periodo.dataFim,
      inicioOcupacao: periodo.inicioOcupacao,
      fimOcupacao: periodo.fimOcupacao,
      modeloAtendimento: contexto.modeloAtendimento,
      enderecoAtendimento: params.enderecoAtendimento?.trim() || null,
      deslocamentoMinutos: periodo.deslocamentoMinutos,
      criadoPorId: params.auditoria.criadoPorId,
      origem: params.auditoria.origem,
      observacoes: params.auditoria.observacoes?.trim() || null,
      status: 'AGENDADO',
      valorTotal: periodo.valorTotal,
      servicos: { connect: contexto.servicos.map((servico) => ({ id: servico.id })) },
      itens: {
        create: contexto.servicos.map((servico, ordem) => ({
          servicoId: servico.id,
          ordem: ordem + 1,
          duracaoMinutos: servico.duracaoMinutos,
          preparoAntesMinutos: servico.preparoAntesMinutos,
          preparoDepoisMinutos: servico.preparoDepoisMinutos,
          preco: Number(servico.preco),
        })),
      },
      recursos: { create: this.dadosRecursos(recursos, periodo) },
    };
  }

  private dadosRecursos(recursos: AlocacaoRecurso[], periodo: PeriodoAgenda) {
    return recursos.map((recurso) => ({
      ...recurso,
      inicio: periodo.inicioOcupacao,
      fim: periodo.fimOcupacao,
    }));
  }

  private dadosHistorico(params: any) {
    return {
      agendamentoId: params.agendamento.id,
      alteradoPorId: params.alteradoPorId,
      dataAnterior: params.agendamento.data,
      dataFimAnterior: params.agendamento.dataFim,
      unidadeIdAnterior: params.agendamento.unidadeId,
      dataNova: params.periodo.data,
      dataFimNova: params.periodo.dataFim,
      unidadeIdNova: params.contexto.unidadeId,
      motivo: params.motivo?.trim() || null,
    };
  }

  private atualizarRelacionamentoCliente(cliente: any, params: any) {
    return cliente.clienteEstabelecimento.upsert({
      where: {
        estabelecimentoId_usuarioId: {
          estabelecimentoId: params.contexto.estabelecimentoId,
          usuarioId: params.usuarioId,
        },
      },
      update: { ultimoAgendamentoEm: params.periodo.data },
      create: {
        estabelecimentoId: params.contexto.estabelecimentoId,
        usuarioId: params.usuarioId,
        origem: 'AGENDAMENTO',
        primeiroAgendamentoEm: params.periodo.data,
        ultimoAgendamentoEm: params.periodo.data,
      },
    });
  }

  private inclusoesAgendamento() {
    return {
      profissional: { select: { id: true, nome: true } },
      unidade: { select: { id: true, nome: true } },
      itens: { orderBy: { ordem: 'asc' }, include: { servico: true } },
      recursos: { include: { recurso: true } },
    };
  }
}
