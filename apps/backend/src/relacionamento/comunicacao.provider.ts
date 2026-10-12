import { Injectable } from '@nestjs/common';
import { CanalComunicacao } from './relacionamento.constants';

export interface MensagemProvedor {
  envioId: number;
  chaveIdempotencia?: string | null;
  destinatario: string;
  assunto?: string | null;
  conteudo: string;
  metadados?: Record<string, unknown> | null;
}

export interface ResultadoProvedor {
  provedor: string;
  referenciaExterna: string;
  resposta: Record<string, unknown>;
}

export class FalhaProvedorComunicacao extends Error {
  constructor(message: string, readonly permanente = false) { super(message); }
}

export interface AdaptadorComunicacao {
  readonly canal: CanalComunicacao;
  enviar(mensagem: MensagemProvedor): Promise<ResultadoProvedor>;
}

abstract class AdaptadorSimulado implements AdaptadorComunicacao {
  abstract readonly canal: CanalComunicacao;

  async enviar(mensagem: MensagemProvedor): Promise<ResultadoProvedor> {
    const destino = mensagem.destinatario.toLowerCase();
    if (destino.includes('falha-permanente')) throw new FalhaProvedorComunicacao('Falha permanente simulada pelo provedor', true);
    if (destino.includes('falha-temporaria')) throw new FalhaProvedorComunicacao('Falha temporária simulada pelo provedor');
    const provedor = `${this.canal.toLowerCase()}-simulado`;
    return {
      provedor,
      referenciaExterna: `${provedor}-${mensagem.envioId}-${Date.now()}`,
      resposta: { aceito: true, simulado: true },
    };
  }
}

@Injectable()
export class PushSimuladoProvider extends AdaptadorSimulado { readonly canal = 'PUSH' as const; }

@Injectable()
export class EmailSimuladoProvider extends AdaptadorSimulado { readonly canal = 'EMAIL' as const; }

@Injectable()
export class WhatsappSimuladoProvider extends AdaptadorSimulado { readonly canal = 'WHATSAPP' as const; }

@Injectable()
export class ComunicacaoProviderRegistry {
  private readonly adaptadores: AdaptadorComunicacao[];

  constructor(push: PushSimuladoProvider, email: EmailSimuladoProvider, whatsapp: WhatsappSimuladoProvider) {
    this.adaptadores = [push, email, whatsapp];
  }

  obter(canal: string) {
    const adaptador = this.adaptadores.find((item) => item.canal === canal);
    if (!adaptador) throw new FalhaProvedorComunicacao(`Canal ${canal} sem provedor configurado`, true);
    return adaptador;
  }
}
