import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { numeroBanco as n, PeriodoMetricas, taxa } from './governanca.dto';

@Injectable()
export class MetricasRelacionamentoRepository {
  constructor(private readonly prisma: PrismaService) {}
  async obter(estabelecimentoId: number, p: PeriodoMetricas) {
    if (p.campanhaId && !await (this.prisma as any).campanhaComunicacao.findFirst({ where: { id: p.campanhaId, estabelecimentoId }, select: { id: true } })) throw new NotFoundException('Campanha não encontrada');
    const [funil, atribuicao, clientes] = await Promise.all([this.funil(estabelecimentoId, p), this.atribuicao(estabelecimentoId, p), this.clientes(estabelecimentoId, p)]);
    return { periodo: { inicio: p.inicio, fimExclusivo: p.fim }, campanhaId: p.campanhaId, funil, atribuicao, clientes, geradoEm: new Date(), regras: { atribuicao: 'Último clique informado por callback autenticado, recebido até a criação da reserva e nos sete dias anteriores; não prova causalidade', receita: 'Líquida das reservas criadas no período que estão concluídas atualmente; não confundir com valor pago', clientes: 'Indicadores da unidade, independentemente do filtro de campanha', aberturas: 'Somente eventos recebidos; ausência de callback não significa zero aberturas', reativacaoDias: 60 } };
  }

  private async funil(id: number, p: PeriodoMetricas) {
    const [r] = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*) total, SUM(e.enviadoEm IS NOT NULL AND e.enviadoEm<${p.fim}) aceitos,
       SUM(e.status='CANCELADO') cancelados, SUM(e.status IN ('FALHA_PERMANENTE','FILA_MORTA')) falhas,
       SUM(EXISTS(SELECT 1 FROM callbacks_envios_comunicacao c WHERE c.envioId=e.id AND c.tipo='ENTREGUE' AND c.recebidoEm < ${p.fim})) entregues,
       SUM(EXISTS(SELECT 1 FROM callbacks_envios_comunicacao c WHERE c.envioId=e.id AND c.tipo='ABERTO' AND c.recebidoEm < ${p.fim})) abertos,
       SUM(EXISTS(SELECT 1 FROM callbacks_envios_comunicacao c WHERE c.envioId=e.id AND c.tipo='CLICADO' AND c.recebidoEm < ${p.fim})) clicados
      FROM envios_comunicacao e WHERE e.estabelecimentoId=${id} AND e.createdAt>=${p.inicio} AND e.createdAt<${p.fim}
       AND (${p.campanhaId} IS NULL OR e.campanhaId=${p.campanhaId})`;
    const total = n(r.total); const aceitos = n(r.aceitos); const entregues = n(r.entregues); const abertos = n(r.abertos); const clicados = n(r.clicados);
    return { total, aceitos, entregues, abertosObservados: abertos, clicadosObservados: clicados, aberturaObservada: abertos > 0, cancelados: n(r.cancelados), falhas: n(r.falhas), callbacksInconsistentes: entregues > aceitos || abertos > entregues || clicados > entregues, taxaEntregaSobreAceitos: entregues <= aceitos ? taxa(entregues, aceitos) : null, taxaAberturaObservadaSobreEntregues: abertos && abertos <= entregues ? taxa(abertos, entregues) : null, taxaCliqueObservadaSobreEntregues: clicados && clicados <= entregues ? taxa(clicados, entregues) : null };
  }

  private async atribuicao(id: number, p: PeriodoMetricas) {
    // A subconsulta escolhe UM envio entre todas as campanhas antes do filtro, sem crédito duplo.
    const [r] = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*) reservas, SUM(a.status='CANCELADO') cancelamentos,
       SUM(a.status='CONCLUIDO') concluidos,
       COALESCE(SUM(CASE WHEN a.status='CONCLUIDO' THEN COALESCE(l.liquidoCentavos/100,f.valorOriginal,a.valorTotal) ELSE 0 END),0) receita,
       COALESCE(SUM(CASE WHEN a.status='CONCLUIDO' AND f.status<>'CANCELADO' THEN f.valorPago ELSE 0 END),0) recebido
      FROM agendamentos a
      JOIN envios_comunicacao e ON e.id=(SELECT ec.id FROM envios_comunicacao ec
        JOIN callbacks_envios_comunicacao c ON c.envioId=ec.id AND c.tipo='CLICADO'
        WHERE ec.estabelecimentoId=a.estabelecimentoId AND ec.usuarioId=a.usuarioId AND ec.campanhaId IS NOT NULL
         AND c.recebidoEm<=a.createdAt AND c.recebidoEm>=DATE_SUB(a.createdAt, INTERVAL 7 DAY)
        ORDER BY c.recebidoEm DESC,ec.id DESC LIMIT 1)
      LEFT JOIN liquidacoes_fidelidade l ON l.agendamentoId=a.id
      LEFT JOIN contas_financeiras f ON f.agendamentoId=a.id AND f.tipo='RECEBER'
      WHERE a.estabelecimentoId=${id} AND a.createdAt>=${p.inicio} AND a.createdAt<${p.fim}
       AND (${p.campanhaId} IS NULL OR e.campanhaId=${p.campanhaId})`;
    return { reservas: n(r.reservas), cancelamentos: n(r.cancelamentos), concluidos: n(r.concluidos), receitaLiquida: n(r.receita), valorRecebidoAtual: n(r.recebido), taxaConclusaoDasReservas: taxa(n(r.concluidos), n(r.reservas)), coorte: 'Reservas criadas no período; status e recebimentos atuais' };
  }

  private async clientes(id: number, p: PeriodoMetricas) {
    const anterior = new Date(p.inicio.getTime() - (p.fim.getTime() - p.inicio.getTime()));
    const [r] = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*) clientes, SUM(x.quantidade>=2) retornaram,
       SUM(x.ultimoAnterior IS NULL) novos,
       SUM(x.ultimoAnterior IS NOT NULL AND x.primeiro>=DATE_ADD(x.ultimoAnterior, INTERVAL 60 DAY)) reativados,
       SUM(x.ultimoAnterior>=${anterior}) retidos
      FROM (SELECT a.usuarioId,COUNT(*) quantidade,MIN(COALESCE(a.finalizadoEm,a.data)) primeiro,
       (SELECT MAX(COALESCE(b.finalizadoEm,b.data)) FROM agendamentos b
        WHERE b.estabelecimentoId=${id} AND b.usuarioId=a.usuarioId AND b.status='CONCLUIDO'
         AND COALESCE(b.finalizadoEm,b.data)<${p.inicio}) ultimoAnterior
       FROM agendamentos a WHERE a.estabelecimentoId=${id} AND a.status='CONCLUIDO'
        AND COALESCE(a.finalizadoEm,a.data)>=${p.inicio} AND COALESCE(a.finalizadoEm,a.data)<${p.fim}
       GROUP BY a.usuarioId) x`;
    const [base] = await this.prisma.$queryRaw<any[]>`SELECT COUNT(DISTINCT usuarioId) total FROM agendamentos WHERE estabelecimentoId=${id} AND status='CONCLUIDO' AND COALESCE(finalizadoEm,data)>=${anterior} AND COALESCE(finalizadoEm,data)<${p.inicio}`;
    return { atendidos: n(r.clientes), novos: n(r.novos), retornoNoPeriodo: n(r.retornaram), reativados: n(r.reativados), basePeriodoAnterior: n(base.total), retidos: n(r.retidos), taxaRetencao: taxa(n(r.retidos), n(base.total)) };
  }
}
