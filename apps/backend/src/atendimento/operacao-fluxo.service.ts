import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfiguracaoFluxoAtendimento } from '@uniflowabs/core';
import { PrismaService } from 'src/db/prisma.service';
import { AgendaAtualizacaoService } from 'src/motor-agenda/agenda-atualizacao.service';

const CAMPOS = { fluxoAtendimentoAutomaticoAtivo: true, inicioAtendimentoAutomaticoAtivo: true, finalizacaoAtendimentoAutomaticaAtiva: true, avisoAtendimentoAntecedenciaMinutos: true } as const;

@Injectable()
export class OperacaoFluxoService {
  constructor(private readonly prisma: PrismaService, private readonly revisoes: AgendaAtualizacaoService) {}

  async configuracao(estabelecimentoId: number) {
    const dados = await this.prisma.estabelecimento.findUnique({ where: { id: estabelecimentoId }, select: CAMPOS });
    if (!dados) throw new NotFoundException('Estabelecimento não encontrado');
    return dados;
  }

  async configurar(estabelecimentoId: number, usuarioId: number, dados: ConfiguracaoFluxoAtendimento) {
    for (const campo of ['fluxoAtendimentoAutomaticoAtivo', 'inicioAtendimentoAutomaticoAtivo', 'finalizacaoAtendimentoAutomaticaAtiva'] as const) {
      if (typeof dados?.[campo] !== 'boolean') throw new BadRequestException('Informe as três opções de automação');
    }
    if (!Number.isInteger(dados.avisoAtendimentoAntecedenciaMinutos) || dados.avisoAtendimentoAntecedenciaMinutos < 1 || dados.avisoAtendimentoAntecedenciaMinutos > 60) throw new BadRequestException('Antecedência deve estar entre 1 e 60 minutos');
    const resultado = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id = ${estabelecimentoId} FOR UPDATE`;
      const anterior = await tx.estabelecimento.findUnique({ where: { id: estabelecimentoId }, select: CAMPOS });
      if (!anterior) throw new NotFoundException('Estabelecimento não encontrado');
      const proximo = { fluxoAtendimentoAutomaticoAtivo: dados.fluxoAtendimentoAutomaticoAtivo, inicioAtendimentoAutomaticoAtivo: dados.inicioAtendimentoAutomaticoAtivo, finalizacaoAtendimentoAutomaticaAtiva: dados.finalizacaoAtendimentoAutomaticaAtiva, avisoAtendimentoAntecedenciaMinutos: dados.avisoAtendimentoAntecedenciaMinutos };
      if ((Object.keys(CAMPOS) as Array<keyof ConfiguracaoFluxoAtendimento>).every((campo) => anterior[campo] === proximo[campo])) return anterior;
      if (!dados.fluxoAtendimentoAutomaticoAtivo || !dados.inicioAtendimentoAutomaticoAtivo || !dados.finalizacaoAtendimentoAutomaticaAtiva) await tx.transicaoAgendamento.updateMany({
        where: { estabelecimentoId, status: 'AGENDADA', ...(!dados.fluxoAtendimentoAutomaticoAtivo ? {} : { OR: [
          ...(!dados.inicioAtendimentoAutomaticoAtivo ? [{ tipo: 'INICIAR' }] : []),
          ...(!dados.finalizacaoAtendimentoAutomaticaAtiva ? [{ tipo: 'FINALIZAR' }] : []),
        ] }) },
        data: { status: 'CANCELADA', processadoEm: new Date(), proximaTentativaEm: null, erro: 'CONFIGURACAO_ALTERADA' },
      });
      const salvo = await tx.estabelecimento.update({ where: { id: estabelecimentoId }, data: proximo, select: CAMPOS });
      // Somente cancelamentos por configuração, na revisão atual e sem intervenção manual.
      if (dados.fluxoAtendimentoAutomaticoAtivo) await tx.$executeRaw`
        UPDATE transicoes_agendamentos t JOIN agendamentos a ON a.id = t.agendamentoId
        SET t.status = 'AGENDADA', t.processadoEm = NULL, t.erro = NULL, t.proximaTentativaEm = NULL,
            t.bloqueadoEm = NULL, t.bloqueadoPor = NULL
        WHERE t.estabelecimentoId = ${estabelecimentoId} AND a.estabelecimentoId = ${estabelecimentoId}
          AND t.status = 'CANCELADA' AND t.erro IN ('CONFIGURACAO_ALTERADA', 'AUTOMACAO_INATIVA', 'INICIO_AUTOMATICO_INATIVO', 'FINALIZACAO_AUTOMATICA_INATIVA')
          AND t.revisaoFluxo = a.revisaoFluxo AND a.automacaoAtendimentoAtiva = TRUE AND a.controleManualEm IS NULL
          AND a.status IN ('AGENDADO', 'CONFIRMADO', 'CHECKIN')
          AND ((t.tipo = 'AVISO' AND a.data > NOW()) OR (t.tipo = 'INICIAR' AND ${dados.inicioAtendimentoAutomaticoAtivo} AND a.status IN ('AGENDADO', 'CONFIRMADO')) OR (t.tipo = 'FINALIZAR' AND ${dados.finalizacaoAtendimentoAutomaticaAtiva}))`;
      await tx.$executeRaw`
        UPDATE transicoes_agendamentos t JOIN agendamentos a ON a.id = t.agendamentoId
        SET t.dataPrevista = TIMESTAMPADD(MINUTE, ${-dados.avisoAtendimentoAntecedenciaMinutos}, a.data)
        WHERE t.estabelecimentoId = ${estabelecimentoId} AND a.estabelecimentoId = ${estabelecimentoId}
          AND t.status = 'AGENDADA' AND t.tipo = 'AVISO' AND t.revisaoFluxo = a.revisaoFluxo
          AND a.data > NOW() AND a.controleManualEm IS NULL`;
      await tx.logAuditoria.create({ data: { estabelecimentoId, usuarioId, acao: 'ATENDIMENTO_CONFIGURACAO_ALTERADA', entidade: 'Estabelecimento', entidadeId: String(estabelecimentoId), detalhes: { anterior, novo: proximo } } });
      return salvo;
    });
    this.revisoes.publicar(estabelecimentoId);
    return resultado;
  }

  async monitorar(estabelecimentoId: number, agora = new Date()) {
    const desde = new Date(agora.getTime() - 7 * 86400000);
    const log = { estabelecimentoId, createdAt: { gte: desde }, acao: 'AGENDAMENTO_STATUS_ALTERADO' };
    const pendentes = { estabelecimentoId, status: 'AGENDADA', dataPrevista: { lt: agora } };
    const [automaticas, manuais, atrasos, tarefasAtrasadas, falhas, divergencias, tarefas] = await Promise.all([
      this.prisma.logAuditoria.count({ where: { ...log, detalhes: { path: '$.origem', equals: 'AUTOMATICA' } } }),
      this.prisma.logAuditoria.count({ where: { ...log, detalhes: { path: '$.origem', equals: 'MANUAL' } } }),
      this.prisma.logAuditoria.count({ where: { ...log, detalhes: { path: '$.novo', equals: 'ATRASADO' } } }),
      this.prisma.transicaoAgendamento.count({ where: pendentes }),
      this.prisma.transicaoAgendamento.count({ where: { estabelecimentoId, status: 'FALHOU' } }),
      this.prisma.agendamento.count({ where: { estabelecimentoId, status: 'CONCLUIDO', finalizadoEm: { gte: desde }, OR: [{ valorTotal: { gt: 0 } }, { servicos: { some: { preco: { gt: 0 } } } }], NOT: { liquidacaoFidelidade: { is: { liquidoCentavos: 0 } } }, contasFinanceiras: { none: { tipo: 'RECEBER' } } } }),
      this.prisma.transicaoAgendamento.findMany({ where: { estabelecimentoId, OR: [{ status: 'FALHOU' }, { status: 'AGENDADA', dataPrevista: { lt: agora } }, { status: 'PROCESSANDO', bloqueadoEm: { lt: new Date(agora.getTime() - Math.max(10000, Number(process.env.ATENDIMENTOS_WORKER_LOCK_MS) || 60000)) } }] }, orderBy: [{ dataPrevista: 'asc' }, { id: 'asc' }], take: 50, select: { id: true, agendamentoId: true, tipo: true, status: true, dataPrevista: true, tentativas: true, proximaTentativaEm: true } }),
    ]);
    return { geradoEm: agora, periodoDesde: desde, workerHabilitado: process.env.ATENDIMENTOS_WORKER_ATIVO !== 'false', metricas: { automaticas, manuais, atrasos, tarefasAtrasadas, falhas, divergencias }, tarefas };
  }

  async reprocessar(estabelecimentoId: number, usuarioId: number, id: number, agora = new Date()) {
    return this.prisma.$transaction(async (tx) => {
      const tarefa = await tx.transicaoAgendamento.findFirst({ where: { id, estabelecimentoId } });
      if (!tarefa) throw new NotFoundException('Tarefa não encontrada nesta unidade');
      if (!['AVISO', 'INICIAR', 'FINALIZAR'].includes(tarefa.tipo)) throw new ConflictException('Tipo de tarefa não suportado');
      const agendamento = await tx.agendamento.findFirst({ where: { id: tarefa.agendamentoId, estabelecimentoId }, include: { estabelecimento: { select: CAMPOS } } });
      if (!agendamento || tarefa.revisaoFluxo !== agendamento.revisaoFluxo || !agendamento.estabelecimento.fluxoAtendimentoAutomaticoAtivo || !agendamento.automacaoAtendimentoAtiva || agendamento.controleManualEm || !['AGENDADO', 'CONFIRMADO', 'CHECKIN'].includes(agendamento.status)) throw new ConflictException('Reprocessamento recusado: revisão obsoleta, estado terminal ou controle manual/inativo. Não retoma automação.');
      if ((tarefa.tipo === 'INICIAR' && (!agendamento.estabelecimento.inicioAtendimentoAutomaticoAtivo || agendamento.status === 'CHECKIN')) || (tarefa.tipo === 'FINALIZAR' && !agendamento.estabelecimento.finalizacaoAtendimentoAutomaticaAtiva) || (tarefa.tipo === 'AVISO' && agendamento.data <= agora)) throw new ConflictException('Esta tarefa não é mais aplicável');
      const resultado = await tx.transicaoAgendamento.updateMany({ where: { id, estabelecimentoId, status: 'FALHOU', revisaoFluxo: agendamento.revisaoFluxo, agendamento: { estabelecimentoId, revisaoFluxo: tarefa.revisaoFluxo, automacaoAtendimentoAtiva: true, controleManualEm: null, status: { in: ['AGENDADO', 'CONFIRMADO', 'CHECKIN'] }, estabelecimento: { fluxoAtendimentoAutomaticoAtivo: true } } }, data: { status: 'AGENDADA', tentativas: 0, erro: null, processadoEm: null, bloqueadoEm: null, bloqueadoPor: null, proximaTentativaEm: agora } });
      if (!resultado.count) throw new ConflictException('Somente tarefas falhas podem ser reenfileiradas; atualize o painel');
      await tx.logAuditoria.create({ data: { estabelecimentoId, usuarioId, acao: 'ATENDIMENTO_TAREFA_REPROCESSADA', entidade: 'TransicaoAgendamento', entidadeId: String(id), detalhes: { tentativasAnteriores: tarefa.tentativas, revisaoFluxo: tarefa.revisaoFluxo } } });
      return { reenfileirada: true, id };
    });
  }
}
