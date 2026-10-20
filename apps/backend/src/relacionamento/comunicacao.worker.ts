import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ComunicacaoProviderRegistry, FalhaProvedorComunicacao } from './comunicacao.provider';
import { RelacionamentoRepository } from './relacionamento.repository';
import { CampanhaExecucaoRepository } from './campanhas/campanha-execucao.repository';

@Injectable()
export class ComunicacaoWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ComunicacaoWorker.name);
  private readonly workerId = `notificacoes-${process.pid}-${randomUUID()}`;
  private timer?: NodeJS.Timeout;
  private processando = false;

  constructor(private readonly repository: RelacionamentoRepository, private readonly providers: ComunicacaoProviderRegistry, private readonly campanhas: CampanhaExecucaoRepository) {}

  onModuleInit() {
    if (process.env.NOTIFICACOES_WORKER_ATIVO === 'false') return;
    const intervalo = Math.max(1_000, Number(process.env.NOTIFICACOES_WORKER_INTERVALO_MS) || 5_000);
    this.timer = setInterval(() => void this.executarCicloSeguro(), intervalo);
    this.timer.unref();
    void this.executarCicloSeguro();
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  private async executarCicloSeguro() {
    try {
      await this.processarLote();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`Ciclo do worker interrompido: ${mensagem}`);
    }
  }

  async processarLote(limite = 10) {
    if (this.processando) return { processados: 0, ocupado: true };
    this.processando = true;
    let processados = 0;
    try {
      while (processados < limite) {
        const envio = await this.repository.reivindicarProximo(this.workerId);
        if (!envio) break;
        await this.processar(envio);
        processados += 1;
      }
      return { processados, ocupado: false };
    } finally {
      this.processando = false;
    }
  }

  private async processar(envio: any) {
    const provedorNome = `${String(envio.canal).toLowerCase()}-simulado`;
    let tentativa: any;
    try {
      if (!await this.campanhas.autorizar(envio)) return;
      if (!await this.repository.autorizarPrivacidade(envio)) return;
      tentativa = await this.repository.iniciarTentativa(envio.id, provedorNome);
      const resultado = await this.providers.obter(envio.canal).enviar({
        envioId: envio.id, chaveIdempotencia: envio.chaveIdempotencia,
        destinatario: envio.destinatario, assunto: envio.assunto,
        conteudo: envio.conteudo, metadados: envio.metadados,
      });
      await this.repository.concluirEnvio(envio.id, tentativa.id, resultado);
    } catch (error) {
      const falha = error instanceof FalhaProvedorComunicacao ? error : new FalhaProvedorComunicacao('Falha interna ao processar comunicação');
      this.logger.warn(`Envio ${envio.id} falhou: ${falha.message}`);
      if (tentativa) await this.repository.falharEnvio(envio, tentativa.id, falha.message, falha.permanente);
    }
  }
}
