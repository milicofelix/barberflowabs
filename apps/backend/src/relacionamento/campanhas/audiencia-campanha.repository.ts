import { BadRequestException, Injectable } from '@nestjs/common';
import { FiltrosCampanha } from './campanha.dto';

@Injectable()
export class AudienciaCampanhaRepository {
  async selecionar(tx: any, estabelecimentoId: number, filtros: FiltrosCampanha, agora: Date) {
    const audiencia: Array<{ clienteId: number; usuarioId: number; evidencia: any }> = [];
    let cursor = 0;
    while (true) {
      const clientes = await tx.clienteEstabelecimento.findMany({
        where: { estabelecimentoId, status: 'ATIVO', id: { gt: cursor }, ...(filtros.tags?.length ? { OR: filtros.tags.map((tag) => ({ tags: { array_contains: [tag] } })) } : {}) },
        select: { id: true, usuarioId: true }, orderBy: { id: 'asc' }, take: 250,
      });
      if (!clientes.length) break;
      const usuarios = clientes.map((cliente: any) => cliente.usuarioId);
      const historico = { estabelecimentoId, usuarioId: { in: usuarios }, status: 'CONCLUIDO', data: { lte: agora } };
      const [atendimentos, ultimos] = await Promise.all([
        tx.agendamento.groupBy({ by: ['usuarioId'], where: { ...historico, ...(filtros.unidadeId ? { unidadeId: filtros.unidadeId } : {}), ...(filtros.profissionalId ? { profissionalId: filtros.profissionalId } : {}), ...(filtros.servicoId ? { servicos: { some: { id: filtros.servicoId } } } : {}) }, _count: { _all: true } }),
        filtros.inatividadeDias ? tx.agendamento.groupBy({ by: ['usuarioId'], where: historico, _max: { data: true } }) : [],
      ]);
      const contagens = new Map<number, number>(atendimentos.map((item: any) => [item.usuarioId, item._count._all]));
      const datas = new Map<number, Date>(ultimos.map((item: any) => [item.usuarioId, item._max.data]));
      const exigeHistorico = !!(filtros.unidadeId || filtros.servicoId || filtros.profissionalId || filtros.recorrenciaMinima);
      for (const cliente of clientes) {
        const quantidade = contagens.get(cliente.usuarioId) ?? 0; const ultima = datas.get(cliente.usuarioId);
        if (exigeHistorico && quantidade < (filtros.recorrenciaMinima ?? 1)) continue;
        if (filtros.inatividadeDias && (!ultima || ultima.getTime() > agora.getTime() - filtros.inatividadeDias * 86400000)) continue;
        audiencia.push({ clienteId: cliente.id, usuarioId: cliente.usuarioId, evidencia: { atendimentosConcluidosNoFiltro: quantidade, ultimoAtendimentoEm: ultima?.toISOString() ?? null } });
        if (audiencia.length > 5000) throw new BadRequestException('Campanha limitada a 5.000 destinatários; refine os filtros');
      }
      cursor = clientes[clientes.length - 1].id;
    }
    return audiencia;
  }
}
