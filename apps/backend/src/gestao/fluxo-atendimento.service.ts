import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { OrigemTransicaoAtendimento, StatusAgendamento } from '@uniflowabs/core';
import { PrismaService } from 'src/db/prisma.service';
import { FinanceiroService } from 'src/financeiro/financeiro.service';
import { AgendaAtualizacaoService } from 'src/motor-agenda/agenda-atualizacao.service';

const TRANSICOES: Record<StatusAgendamento, StatusAgendamento[]> = {
  AGENDADO: ['CONFIRMADO', 'ATRASADO', 'CHECKIN', 'CANCELADO', 'NO_SHOW'],
  CONFIRMADO: ['ATRASADO', 'CHECKIN', 'CANCELADO', 'NO_SHOW'],
  ATRASADO: ['CHECKIN', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW'],
  CHECKIN: ['ATRASADO', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW'],
  CONCLUIDO: [],
  CANCELADO: [],
  NO_SHOW: [],
};

const STATUS_QUE_ASSUMEM_CONTROLE_MANUAL: StatusAgendamento[] = [
  'ATRASADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW',
];

const INCLUDE_AGENDAMENTO = {
  usuario: { select: { id: true, nome: true, email: true, telefone: true } },
  profissional: { select: { id: true, nome: true } },
  servicos: { select: { id: true, nome: true, preco: true, qtdeSlots: true } },
} as const;

export interface AlterarStatusAtendimento {
  agendamentoId: number;
  estabelecimentoId: number;
  status: StatusAgendamento;
  origem: OrigemTransicaoAtendimento;
  usuarioId?: number | null;
  motivo?: string | null;
  agora?: Date;
}

@Injectable()
export class FluxoAtendimentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeiro: FinanceiroService,
    private readonly atualizacoesAgenda: AgendaAtualizacaoService,
  ) {}

  alterarManual(
    agendamentoId: number,
    estabelecimentoId: number,
    status: StatusAgendamento,
    usuarioId: number,
    motivo?: string | null,
  ) {
    return this.alterar({
      agendamentoId, estabelecimentoId, status, usuarioId, motivo, origem: 'MANUAL',
    });
  }

  alterarAutomatico(
    agendamentoId: number,
    estabelecimentoId: number,
    status: StatusAgendamento,
    agora = new Date(),
  ) {
    return this.alterar({
      agendamentoId, estabelecimentoId, status, origem: 'AUTOMATICA', agora,
    });
  }

  async alterar(comando: AlterarStatusAtendimento) {
    const agora = comando.agora ?? new Date();
    const resultado = await this.prisma.$transaction(async (tx: any) => {
      const atual = await tx.agendamento.findFirst({
        where: { id: comando.agendamentoId, estabelecimentoId: comando.estabelecimentoId },
        include: INCLUDE_AGENDAMENTO,
      });
      if (!atual) throw new NotFoundException('Agendamento não encontrado');

      if (atual.status === comando.status) return { agendamento: atual, alterado: false };
      this.validarTransicao(atual, comando, agora);

      const assumeControleManual = comando.origem === 'MANUAL'
        && STATUS_QUE_ASSUMEM_CONTROLE_MANUAL.includes(comando.status);
      const dados: Record<string, any> = { status: comando.status };
      if (assumeControleManual) {
        dados.automacaoAtendimentoAtiva = false;
        dados.controleManualEm = agora;
        dados.controleManualPorId = comando.usuarioId;
      }
      if (comando.status === 'CHECKIN' && !atual.iniciadoEm) dados.iniciadoEm = agora;
      if (comando.status === 'CONCLUIDO' && !atual.finalizadoEm) dados.finalizadoEm = agora;

      const atualizado = await tx.agendamento.updateMany({
        where: {
          id: atual.id,
          estabelecimentoId: comando.estabelecimentoId,
          status: atual.status,
          revisaoFluxo: atual.revisaoFluxo,
        },
        data: dados,
      });
      if (atualizado.count !== 1) {
        const concorrente = await tx.agendamento.findFirst({
          where: { id: atual.id, estabelecimentoId: comando.estabelecimentoId },
          include: INCLUDE_AGENDAMENTO,
        });
        if (concorrente?.status === comando.status) return { agendamento: concorrente, alterado: false };
        throw new ConflictException('O agendamento foi alterado por outra operação');
      }

      if (assumeControleManual || ['CONCLUIDO', 'CANCELADO', 'NO_SHOW'].includes(comando.status)) {
        await tx.transicaoAgendamento.updateMany({
          where: { agendamentoId: atual.id, status: { in: ['AGENDADA', 'PROCESSANDO'] } },
          data: { status: 'CANCELADA', processadoEm: agora, bloqueadoEm: null, bloqueadoPor: null },
        });
      }

      await tx.logAuditoria.create({ data: {
        estabelecimentoId: comando.estabelecimentoId,
        usuarioId: comando.origem === 'MANUAL' ? comando.usuarioId : null,
        acao: 'AGENDAMENTO_STATUS_ALTERADO',
        entidade: 'Agendamento',
        entidadeId: String(atual.id),
        detalhes: {
          anterior: atual.status,
          novo: comando.status,
          origem: comando.origem,
          motivo: comando.motivo?.trim() || null,
          revisaoFluxo: atual.revisaoFluxo,
          dataEfetiva: agora.toISOString(),
        },
      } });

      const agendamento = await tx.agendamento.findUnique({
        where: { id: atual.id }, include: INCLUDE_AGENDAMENTO,
      });
      return { agendamento, alterado: true };
    });

    await this.aplicarEfeitosIdempotentes(resultado.agendamento, comando);
    if (resultado.alterado) this.atualizacoesAgenda.publicar(comando.estabelecimentoId);
    return resultado.agendamento;
  }

  private validarTransicao(atual: any, comando: AlterarStatusAtendimento, agora: Date) {
    const statusAtual = atual.status as StatusAgendamento;
    if (!(TRANSICOES[statusAtual] ?? []).includes(comando.status)) {
      throw new BadRequestException(`Não é possível alterar de ${atual.status} para ${comando.status}`);
    }
    if (comando.status === 'NO_SHOW' && atual.data.getTime() > agora.getTime()) {
      throw new BadRequestException('Ausência só pode ser registrada após o início do atendimento');
    }
    if (comando.origem === 'AUTOMATICA') {
      if (!atual.automacaoAtendimentoAtiva || atual.controleManualEm) {
        throw new ConflictException('O agendamento está sob controle manual');
      }
      const automaticaValida = (
        comando.status === 'CHECKIN' && ['AGENDADO', 'CONFIRMADO'].includes(atual.status)
      ) || (comando.status === 'CONCLUIDO' && atual.status === 'CHECKIN');
      if (!automaticaValida) throw new BadRequestException('Transição automática inválida');
      if (comando.status === 'CHECKIN' && atual.data.getTime() > agora.getTime()) {
        throw new BadRequestException('O atendimento ainda não atingiu o horário de início');
      }
      if (comando.status === 'CONCLUIDO' && atual.dataFim?.getTime() > agora.getTime()) {
        throw new BadRequestException('O atendimento ainda não atingiu o horário de término');
      }
    }
  }

  private async aplicarEfeitosIdempotentes(agendamento: any, comando: AlterarStatusAtendimento) {
    if (comando.status === 'CONCLUIDO') {
      await this.financeiro.registrarReceitaAgendamento(
        comando.estabelecimentoId,
        comando.origem === 'MANUAL' ? comando.usuarioId ?? null : null,
        agendamento,
      );
    }
    if (['CANCELADO', 'NO_SHOW'].includes(comando.status)) {
      await this.prisma.envioComunicacao.updateMany({
        where: { agendamentoId: agendamento.id, status: { in: ['AGENDADO', 'RETENTATIVA'] } },
        data: { status: 'CANCELADO', erro: 'Cancelado pela mudança de status do agendamento' },
      });
    }
  }
}
