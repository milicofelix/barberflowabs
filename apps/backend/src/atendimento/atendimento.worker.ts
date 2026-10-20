import { HttpException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FluxoAtendimentoService } from 'src/gestao/fluxo-atendimento.service';
import { OrquestradorAtendimentoService } from './orquestrador-atendimento.service';

@Injectable()
export class AtendimentoWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AtendimentoWorker.name);
  private readonly workerId = `atendimentos-${process.pid}-${randomUUID()}`;
  private timer?: NodeJS.Timeout;
  private processando = false;
  private ultimaReconciliacaoEm = 0;

  constructor(
    private readonly orquestrador: OrquestradorAtendimentoService,
    private readonly fluxo: FluxoAtendimentoService,
  ) {}

  onModuleInit() {
    if (process.env.ATENDIMENTOS_WORKER_ATIVO === 'false') return;
    const intervalo = Math.max(1_000, Number(process.env.ATENDIMENTOS_WORKER_INTERVALO_MS) || 5_000);
    this.timer = setInterval(() => void this.executarCicloSeguro(), intervalo);
    this.timer.unref();
    void this.executarCicloSeguro();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async processarLote(limite = 20, agora = new Date()) {
    if (this.processando) return { processadas: 0, ocupado: true };
    this.processando = true;
    let processadas = 0;
    try {
      if (agora.getTime() - this.ultimaReconciliacaoEm >= 60_000) {
        const reconciliacao = await this.orquestrador.reconciliar(agora);
        this.ultimaReconciliacaoEm = agora.getTime();
        if (reconciliacao.criadas) {
          this.logger.log(`Reconciliação concluída: verificadas=${reconciliacao.verificados} criadas=${reconciliacao.criadas}`);
        }
      }
      const lockMs = Math.max(10_000, Number(process.env.ATENDIMENTOS_WORKER_LOCK_MS) || 60_000);
      while (processadas < limite) {
        const tarefa = await this.orquestrador.reivindicarProxima(this.workerId, agora, lockMs);
        if (!tarefa) break;
        await this.processar(tarefa, agora);
        processadas += 1;
      }
      if (processadas) {
        this.logger.log(`Ciclo concluído: tarefas=${processadas} metricas=${JSON.stringify(this.orquestrador.obterMetricas())}`);
      }
      return { processadas, ocupado: false };
    } finally {
      this.processando = false;
    }
  }

  private async executarCicloSeguro() {
    try {
      await this.processarLote();
    } catch (error) {
      this.logger.error(`Falha no ciclo do worker: ${this.mensagemSegura(error)}`);
    }
  }

  private async processar(tarefa: any, agora: Date) {
    try {
      const validacao = await this.orquestrador.validarTarefa(tarefa);
      if (!validacao.valida) {
        await this.orquestrador.cancelarTarefa(tarefa.id, validacao.motivo, agora);
        return;
      }
      if (tarefa.tipo === 'AVISO') {
        await this.orquestrador.notificar(tarefa, validacao.agendamento, agora);
        return;
      }
      if (tarefa.tipo === 'INICIAR') {
        await this.fluxo.alterarAutomatico(
          tarefa.agendamentoId, tarefa.estabelecimentoId, 'CHECKIN', agora,
        );
        await this.orquestrador.concluirTarefa(tarefa.id, agora);
        return;
      }
      if (tarefa.tipo === 'FINALIZAR') {
        await this.fluxo.alterarAutomatico(
          tarefa.agendamentoId, tarefa.estabelecimentoId, 'CONCLUIDO', agora,
        );
        await this.orquestrador.concluirTarefa(tarefa.id, agora);
        return;
      }
      await this.orquestrador.cancelarTarefa(tarefa.id, 'TIPO_DESCONHECIDO', agora);
    } catch (error) {
      if (error instanceof HttpException && [400, 404, 409].includes(error.getStatus())) {
        await this.orquestrador.cancelarTarefa(tarefa.id, `REGRA_DOMINIO_${error.getStatus()}`, agora);
        return;
      }
      const maxTentativas = Math.max(1, Number(process.env.ATENDIMENTOS_WORKER_MAX_TENTATIVAS) || 5);
      const falha = await this.orquestrador.registrarFalha(
        tarefa, this.mensagemSegura(error), maxTentativas, agora,
      );
      this.logger.warn(
        `Tarefa falhou: id=${tarefa.id} tipo=${tarefa.tipo} tentativa=${tarefa.tentativas} terminal=${falha.excedeu}`,
      );
    }
  }

  private mensagemSegura(error: unknown) {
    const nome = error instanceof Error ? error.name : 'ErroDesconhecido';
    const codigo = typeof error === 'object' && error && 'code' in error
      ? String((error as any).code)
      : 'SEM_CODIGO';
    return `${nome}:${codigo}`;
  }
}
