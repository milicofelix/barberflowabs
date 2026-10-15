import { Injectable } from '@nestjs/common';
import { CarteiraFidelidadeRepository, auditarFidelidade } from './carteira-fidelidade.repository';
import { BeneficioFidelidadeRepository } from './beneficio-fidelidade.repository';
import { liquidoCentavos } from './fidelidade.dto';
import { validarIdentidadesIndicacao } from './indicacao-fidelidade.repository';

/** Executado dentro da transação da mudança de status, com o agendamento bloqueado. */
@Injectable()
export class LiquidacaoFidelidadeService {
  constructor(private readonly carteiras: CarteiraFidelidadeRepository, private readonly beneficios: BeneficioFidelidadeRepository) {}

  async aplicar(tx: any, a: any, usuarioId: number | null, agora: Date) {
    if (!['CONCLUIDO', 'CANCELADO', 'NO_SHOW'].includes(a.status)) return;
    // O chamador já bloqueou estabelecimento -> agendamento; segue programa -> carteira.
    await tx.$queryRaw`SELECT estabelecimentoId FROM programas_fidelidade WHERE estabelecimentoId = ${a.estabelecimentoId} FOR UPDATE`;
    if (a.status !== 'CONCLUIDO') return this.beneficios.cancelarNaTransacao(tx, a, usuarioId);
    if (await tx.liquidacaoFidelidade.findUnique({ where: { agendamentoId: a.id } })) return;
    const programa = await tx.programaFidelidade.findUnique({ where: { estabelecimentoId: a.estabelecimentoId } });
    const beneficio = await tx.beneficioFidelidade.findFirst({ where: { agendamentoId: a.id, status: 'APLICADO' } });
    const liquido = liquidoCentavos(a, beneficio?.descontoCentavos ?? 0);
    const cliente = await tx.clienteEstabelecimento.findUnique({ where: { estabelecimentoId_usuarioId: { estabelecimentoId: a.estabelecimentoId, usuarioId: a.usuarioId } } });
    const pontos = programa?.ativo && cliente?.status === 'ATIVO' ? Math.min(2147483647, Math.floor(liquido / programa.centavosPorPonto)) : 0;
    if (cliente) {
      await this.carteiras.bloquear(tx, cliente.id);
      if (pontos) await this.carteiras.creditar(tx, cliente.id, pontos, `ganho:agendamento:${a.id}`, 'GANHO', programa.validadeDias, { agendamentoId: a.id, liquidoCentavos: liquido, centavosPorPonto: programa.centavosPorPonto }, agora);
      if (programa?.ativo && cliente.status === 'ATIVO') await this.premiarIndicacao(tx, a, cliente, programa, liquido, agora);
    }
    if (beneficio) await tx.beneficioFidelidade.update({ where: { id: beneficio.id }, data: { status: 'CONSUMIDO' } });
    await tx.liquidacaoFidelidade.create({ data: { agendamentoId: a.id, liquidoCentavos: liquido, pontos } });
    await auditarFidelidade(tx, a.estabelecimentoId, usuarioId, 'FIDELIDADE_ATENDIMENTO_LIQUIDADO', a.id, { pontos, liquidoCentavos: liquido, beneficioId: beneficio?.id ?? null });
  }

  private async premiarIndicacao(tx: any, a: any, cliente: any, programa: any, liquido: number, agora: Date) {
    const indicacao = await tx.indicacaoFidelidade.findUnique({ where: { indicadoId: cliente.id } });
    if (!indicacao || indicacao.status !== 'APROVADA') return;
    const anteriores = await tx.agendamento.count({ where: { estabelecimentoId: a.estabelecimentoId, usuarioId: a.usuarioId, status: 'CONCLUIDO', id: { not: a.id } } });
    let elegivel = !anteriores && liquido >= programa.minimoIndicacaoCentavos;
    const indicador = await tx.clienteEstabelecimento.findFirst({ where: { id: indicacao.indicadorId, estabelecimentoId: a.estabelecimentoId, status: 'ATIVO' }, include: { usuario: true } });
    const indicado = await tx.clienteEstabelecimento.findUnique({ where: { id: cliente.id }, include: { usuario: true } });
    if (!indicador) elegivel = false;
    else {
      try { validarIdentidadesIndicacao(indicador, indicado); } catch { elegivel = false; }
    }
    if (elegivel && indicacao.bonusPontos > 0) {
      await this.carteiras.bloquear(tx, indicador.id);
      await this.carteiras.creditar(tx, indicador.id, indicacao.bonusPontos, `indicacao:${indicacao.id}`, 'INDICACAO', programa.validadeDias, { indicacaoId: indicacao.id, agendamentoId: a.id }, agora);
    }
    await tx.indicacaoFidelidade.update({ where: { id: indicacao.id }, data: { status: elegivel ? 'PREMIADA' : 'INELEGIVEL' } });
    await auditarFidelidade(tx, a.estabelecimentoId, null, 'FIDELIDADE_INDICACAO_PROCESSADA', indicacao.id, { agendamentoId: a.id, elegivel, pontos: elegivel ? indicacao.bonusPontos : 0 });
  }
}
