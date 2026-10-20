import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

const STATUS_ATIVOS = ['AGENDADO', 'CONFIRMADO', 'CHECKIN'];
const STATUS_TAREFAS_PENDENTES = ['AGENDADA', 'PROCESSANDO'];

export interface MetricasFluxoAtendimento {
  reivindicadas: number;
  processadas: number;
  canceladas: number;
  falhas: number;
  retentativas: number;
  notificacoes: number;
}

@Injectable()
export class OrquestradorAtendimentoService {
  private readonly metricas: MetricasFluxoAtendimento = {
    reivindicadas: 0,
    processadas: 0,
    canceladas: 0,
    falhas: 0,
    retentativas: 0,
    notificacoes: 0,
  };

  constructor(private readonly prisma: PrismaService) {}

  async programar(agendamentoId: number, agora = new Date()) {
    const agendamento = await (this.prisma as any).agendamento.findUnique({
      where: { id: agendamentoId },
      include: {
        estabelecimento: {
          select: {
            id: true,
            fluxoAtendimentoAutomaticoAtivo: true,
            inicioAtendimentoAutomaticoAtivo: true,
            finalizacaoAtendimentoAutomaticaAtiva: true,
            avisoAtendimentoAntecedenciaMinutos: true,
          },
        },
      },
    });
    if (!agendamento) return { criadas: 0, motivo: 'AGENDAMENTO_INEXISTENTE' };

    await (this.prisma as any).transicaoAgendamento.updateMany({
      where: {
        agendamentoId,
        revisaoFluxo: { not: agendamento.revisaoFluxo },
        status: { in: STATUS_TAREFAS_PENDENTES },
      },
      data: { status: 'CANCELADA', processadoEm: agora, bloqueadoEm: null, bloqueadoPor: null },
    });

    if (
      !agendamento.estabelecimento.fluxoAtendimentoAutomaticoAtivo
      || !agendamento.automacaoAtendimentoAtiva
      || agendamento.controleManualEm
      || !STATUS_ATIVOS.includes(agendamento.status)
    ) {
      await this.cancelarPendentes(agendamentoId, agora);
      return { criadas: 0, motivo: 'AUTOMACAO_INATIVA' };
    }

    const tarefas: any[] = [];
    const destinatarios = await this.resolverDestinatarios(
      agendamento.estabelecimentoId,
      agendamento.profissionalId,
    );
    const antecedencia = Math.min(
      60,
      Math.max(1, Number(agendamento.estabelecimento.avisoAtendimentoAntecedenciaMinutos) || 10),
    );
    const dataAvisoCalculada = new Date(agendamento.data.getTime() - antecedencia * 60_000);
    if (agendamento.data.getTime() > agora.getTime()) {
      for (const usuarioId of destinatarios) {
        tarefas.push(this.tarefa(
          agendamento,
          'AVISO',
          dataAvisoCalculada < agora ? agora : dataAvisoCalculada,
          usuarioId,
        ));
      }
    }
    if (agendamento.estabelecimento.inicioAtendimentoAutomaticoAtivo) {
      tarefas.push(this.tarefa(agendamento, 'INICIAR', agendamento.data));
    }
    if (agendamento.estabelecimento.finalizacaoAtendimentoAutomaticaAtiva && agendamento.dataFim) {
      tarefas.push(this.tarefa(agendamento, 'FINALIZAR', agendamento.dataFim));
    }

    if (!tarefas.length) return { criadas: 0, destinatarios: destinatarios.length };
    const resultado = await (this.prisma as any).transicaoAgendamento.createMany({
      data: tarefas,
      skipDuplicates: true,
    });
    return { criadas: resultado.count, destinatarios: destinatarios.length };
  }

  async reconciliar(agora = new Date(), limite = 200) {
    const desde = new Date(agora.getTime() - 24 * 60 * 60 * 1_000);
    const agendamentos = await (this.prisma as any).agendamento.findMany({
      where: {
        status: { in: STATUS_ATIVOS },
        automacaoAtendimentoAtiva: true,
        controleManualEm: null,
        OR: [{ data: { gte: agora } }, { dataFim: { gte: desde } }],
        estabelecimento: { fluxoAtendimentoAutomaticoAtivo: true },
      },
      select: { id: true },
      orderBy: { data: 'asc' },
      take: limite,
    });
    let criadas = 0;
    for (const agendamento of agendamentos) {
      const resultado = await this.programar(agendamento.id, agora);
      criadas += resultado.criadas;
    }
    return { verificados: agendamentos.length, criadas };
  }

  async reivindicarProxima(workerId: string, agora: Date, lockMs: number) {
    const lockExpiradoEm = new Date(agora.getTime() - lockMs);
    for (let tentativa = 0; tentativa < 5; tentativa += 1) {
      const candidata = await (this.prisma as any).transicaoAgendamento.findFirst({
        where: {
          dataPrevista: { lte: agora },
          OR: [
            {
              status: 'AGENDADA',
              AND: [{ OR: [{ proximaTentativaEm: null }, { proximaTentativaEm: { lte: agora } }] }],
            },
            { status: 'PROCESSANDO', bloqueadoEm: { lt: lockExpiradoEm } },
          ],
        },
        orderBy: [{ dataPrevista: 'asc' }, { id: 'asc' }],
      });
      if (!candidata) return null;

      const reivindicada = await (this.prisma as any).transicaoAgendamento.updateMany({
        where: {
          id: candidata.id,
          status: candidata.status,
          ...(candidata.status === 'PROCESSANDO'
            ? { bloqueadoEm: candidata.bloqueadoEm }
            : { bloqueadoEm: null }),
        },
        data: {
          status: 'PROCESSANDO',
          bloqueadoEm: agora,
          bloqueadoPor: workerId,
          tentativas: { increment: 1 },
          proximaTentativaEm: null,
          erro: null,
        },
      });
      if (reivindicada.count === 1) {
        this.metricas.reivindicadas += 1;
        return (this.prisma as any).transicaoAgendamento.findUnique({ where: { id: candidata.id } });
      }
    }
    return null;
  }

  async validarTarefa(tarefa: any) {
    const agendamento = await (this.prisma as any).agendamento.findUnique({
      where: { id: tarefa.agendamentoId },
      include: {
        usuario: { select: { nome: true } },
        profissional: { select: { nome: true } },
        estabelecimento: {
          select: {
            fluxoAtendimentoAutomaticoAtivo: true,
            inicioAtendimentoAutomaticoAtivo: true,
            finalizacaoAtendimentoAutomaticaAtiva: true,
          },
        },
      },
    });
    if (!agendamento) return { valida: false, motivo: 'AGENDAMENTO_INEXISTENTE' };
    if (agendamento.revisaoFluxo !== tarefa.revisaoFluxo) return { valida: false, motivo: 'REVISAO_OBSOLETA' };
    if (!agendamento.estabelecimento.fluxoAtendimentoAutomaticoAtivo) return { valida: false, motivo: 'AUTOMACAO_INATIVA' };
    if (!agendamento.automacaoAtendimentoAtiva || agendamento.controleManualEm) return { valida: false, motivo: 'CONTROLE_MANUAL' };
    if (!STATUS_ATIVOS.includes(agendamento.status)) return { valida: false, motivo: 'STATUS_TERMINAL' };
    if (tarefa.tipo === 'INICIAR' && !agendamento.estabelecimento.inicioAtendimentoAutomaticoAtivo) {
      return { valida: false, motivo: 'INICIO_AUTOMATICO_INATIVO' };
    }
    if (tarefa.tipo === 'FINALIZAR' && !agendamento.estabelecimento.finalizacaoAtendimentoAutomaticaAtiva) {
      return { valida: false, motivo: 'FINALIZACAO_AUTOMATICA_INATIVA' };
    }
    return { valida: true, agendamento };
  }

  async notificar(tarefa: any, agendamento: any, agora = new Date()) {
    if (!tarefa.destinatarioUsuarioId || agendamento.data.getTime() <= agora.getTime()) {
      return this.cancelarTarefa(tarefa.id, 'AVISO_FORA_DA_JANELA', agora);
    }
    const notificou = await (this.prisma as any).$transaction(async (tx: any) => {
      const [config] = await tx.$queryRaw`SELECT fluxoAtendimentoAutomaticoAtivo FROM estabelecimentos WHERE id = ${tarefa.estabelecimentoId} FOR UPDATE`;
      const [atual] = await tx.$queryRaw`SELECT revisaoFluxo, automacaoAtendimentoAtiva, controleManualEm, status, data FROM agendamentos WHERE id = ${tarefa.agendamentoId} AND estabelecimentoId = ${tarefa.estabelecimentoId} FOR UPDATE`;
      const [pendente] = await tx.$queryRaw`SELECT status, bloqueadoPor FROM transicoes_agendamentos WHERE id = ${tarefa.id} AND estabelecimentoId = ${tarefa.estabelecimentoId} FOR UPDATE`;
      if (pendente?.status !== 'PROCESSANDO' || pendente.bloqueadoPor !== tarefa.bloqueadoPor) return false;
      if (!config?.fluxoAtendimentoAutomaticoAtivo || !atual || atual.revisaoFluxo !== tarefa.revisaoFluxo || !atual.automacaoAtendimentoAtiva || atual.controleManualEm || !['AGENDADO', 'CONFIRMADO'].includes(atual.status) || atual.data <= agora) {
        await tx.transicaoAgendamento.update({ where: { id: tarefa.id }, data: { status: 'CANCELADA', processadoEm: agora, bloqueadoEm: null, bloqueadoPor: null, erro: 'AVISO_NAO_APLICAVEL' } });
        return false;
      }
      await tx.notificacaoUsuario.create({
        data: {
          usuarioId: tarefa.destinatarioUsuarioId,
          estabelecimentoId: tarefa.estabelecimentoId,
          tipo: 'ATENDIMENTO_PROXIMO',
          titulo: 'Atendimento próximo',
          mensagem: `O atendimento de ${agendamento.usuario.nome} com ${agendamento.profissional.nome} começa em breve.`,
          prioridade: 'ALTA',
          acaoUrl: `/gestao?aba=agenda&agendamentoId=${agendamento.id}`,
          metadados: {
            agendamentoId: agendamento.id,
            profissionalId: agendamento.profissionalId,
            data: agendamento.data.toISOString(),
            chaveIdempotencia: tarefa.chaveIdempotencia,
          },
          expiraEm: agendamento.dataFim ?? agendamento.data,
        },
      });
      await tx.transicaoAgendamento.update({
        where: { id: tarefa.id },
        data: { status: 'PROCESSADA', processadoEm: agora, bloqueadoEm: null, bloqueadoPor: null },
      });
      return true;
    });
    if (notificou) { this.metricas.processadas += 1; this.metricas.notificacoes += 1; }
  }

  async concluirTarefa(id: number, agora = new Date()) {
    const resultado = await (this.prisma as any).transicaoAgendamento.updateMany({
      where: { id, status: { in: ['PROCESSANDO', 'CANCELADA'] } },
      data: {
        status: 'PROCESSADA', processadoEm: agora, bloqueadoEm: null, bloqueadoPor: null,
        proximaTentativaEm: null, erro: null,
      },
    });
    if (resultado.count) this.metricas.processadas += 1;
  }

  async cancelarTarefa(id: number, motivo: string, agora = new Date()) {
    const resultado = await (this.prisma as any).transicaoAgendamento.updateMany({
      where: { id, status: { in: STATUS_TAREFAS_PENDENTES } },
      data: {
        status: 'CANCELADA', processadoEm: agora, bloqueadoEm: null, bloqueadoPor: null,
        proximaTentativaEm: null, erro: motivo.slice(0, 500),
      },
    });
    if (resultado.count) this.metricas.canceladas += 1;
  }

  async registrarFalha(tarefa: any, erro: string, maxTentativas: number, agora = new Date()) {
    const excedeu = Number(tarefa.tentativas) >= maxTentativas;
    const esperaSegundos = Math.min(300, 2 ** Math.max(0, Number(tarefa.tentativas) - 1) * 5);
    await (this.prisma as any).transicaoAgendamento.updateMany({
      where: { id: tarefa.id, status: 'PROCESSANDO', bloqueadoPor: tarefa.bloqueadoPor },
      data: {
        status: excedeu ? 'FALHOU' : 'AGENDADA',
        processadoEm: excedeu ? agora : null,
        proximaTentativaEm: excedeu ? null : new Date(agora.getTime() + esperaSegundos * 1_000),
        bloqueadoEm: null,
        bloqueadoPor: null,
        erro: erro.slice(0, 1_000),
      },
    });
    if (excedeu) this.metricas.falhas += 1;
    else this.metricas.retentativas += 1;
    return { excedeu, esperaSegundos };
  }

  obterMetricas() {
    return { ...this.metricas };
  }

  private cancelarPendentes(agendamentoId: number, agora: Date) {
    return (this.prisma as any).transicaoAgendamento.updateMany({
      where: { agendamentoId, status: { in: STATUS_TAREFAS_PENDENTES } },
      data: { status: 'CANCELADA', processadoEm: agora, bloqueadoEm: null, bloqueadoPor: null, erro: 'AUTOMACAO_INATIVA' },
    });
  }

  private tarefa(agendamento: any, tipo: string, dataPrevista: Date, destinatarioUsuarioId?: number) {
    const sufixo = destinatarioUsuarioId ? `:u${destinatarioUsuarioId}` : '';
    return {
      agendamentoId: agendamento.id,
      estabelecimentoId: agendamento.estabelecimentoId,
      destinatarioUsuarioId: destinatarioUsuarioId ?? null,
      revisaoFluxo: agendamento.revisaoFluxo,
      tipo,
      status: 'AGENDADA',
      chaveIdempotencia: `atendimento:${agendamento.id}:r${agendamento.revisaoFluxo}:${tipo}${sufixo}`,
      dataPrevista,
    };
  }

  private async resolverDestinatarios(estabelecimentoId: number, profissionalId: number) {
    const vinculado = await (this.prisma as any).membroEquipe.findFirst({
      where: { estabelecimentoId, profissionalId, ativo: true },
      select: { usuarioId: true },
    });
    if (vinculado) return [vinculado.usuarioId];

    const membros = await (this.prisma as any).membroEquipe.findMany({
      where: { estabelecimentoId, ativo: true },
      select: { usuarioId: true, permissoes: true, papel: true },
    });
    const autorizados = membros
      .filter((membro: any) => Array.isArray(membro.permissoes)
        && membro.permissoes.includes('AGENDA_GERENCIAR'))
      .map((membro: any) => membro.usuarioId);
    if (autorizados.length) return [...new Set<number>(autorizados)];

    const proprietario = await (this.prisma as any).usuario.findFirst({
      where: { estabelecimentoId, papel: 'ESTABLISHMENT_OWNER' },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    if (proprietario) return [proprietario.id];
    const gestor = membros.find((membro: any) => membro.papel === 'GESTOR');
    return gestor ? [gestor.usuarioId] : [];
  }
}
