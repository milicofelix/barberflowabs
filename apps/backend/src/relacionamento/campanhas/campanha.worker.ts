import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CampanhaExecucaoRepository } from './campanha-execucao.repository';
@Injectable()
export class CampanhaWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private ocupado = false;
  private readonly logger = new Logger(CampanhaWorker.name);
  constructor(private readonly campanhas: CampanhaExecucaoRepository) {}
  onModuleInit() {
    if (process.env.NOTIFICACOES_WORKER_ATIVO === 'false') return;
    this.timer = setInterval(() => void this.ciclo(), Math.max(1000, Number(process.env.NOTIFICACOES_WORKER_INTERVALO_MS) || 5000));
    this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  private async ciclo() {
    if (this.ocupado) return;
    this.ocupado = true;
    try { await this.campanhas.processarLote(); }
    catch (e) { this.logger.warn(`Falha ao processar campanhas: ${e instanceof Error ? e.name : 'Erro'}`); }
    finally { this.ocupado = false; }
  }
}
