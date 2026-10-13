import { Injectable } from '@nestjs/common';

@Injectable()
export class AgendaAtualizacaoService {
  private readonly revisoes = new Map<number, number>();

  obter(estabelecimentoId: number) {
    return this.revisoes.get(estabelecimentoId) ?? 0;
  }

  publicar(estabelecimentoId: number) {
    const anterior = this.obter(estabelecimentoId);
    const revisao = Math.max(Date.now(), anterior + 1);
    this.revisoes.set(estabelecimentoId, revisao);
    return revisao;
  }
}
