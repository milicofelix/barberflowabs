import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificacaoRepository } from './notificacao.repository';

@Injectable()
export class NotificacaoService {
  constructor(private readonly repository: NotificacaoRepository) {}
  listar(usuarioId: number) { return this.repository.listar(usuarioId); }
  async totalNaoLidas(usuarioId: number) { return { total: await this.repository.contarNaoLidas(usuarioId) }; }
  async marcarComoLida(id: number, usuarioId: number) {
    const resultado = await this.repository.marcarComoLida(id, usuarioId);
    if (resultado.count !== 1) throw new NotFoundException('Notificação não encontrada');
    return { sucesso: true };
  }
  async marcarTodasComoLidas(usuarioId: number) {
    const resultado = await this.repository.marcarTodasComoLidas(usuarioId); return { atualizadas: resultado.count };
  }
}
