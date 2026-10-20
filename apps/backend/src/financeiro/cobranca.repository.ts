import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { auditarFinanceiro } from './auditoria-financeira';

@Injectable()
export class CobrancaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any { return this.prisma as any; }

  criarConciliacao(estabelecimentoId: number, usuarioId: number, dados: any) {
    return this.db.$transaction(async (tx: any) => {
      const conciliacao = await tx.conciliacaoFinanceira.upsert({
        where: { estabelecimentoId_provedor_transacaoExternaId: { estabelecimentoId, provedor: dados.provedor, transacaoExternaId: dados.transacaoExternaId } },
        update: dados,
        create: { estabelecimentoId, ...dados },
      });
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_RECONCILIATION_SAVED', 'ConciliacaoFinanceira', conciliacao.id, dados);
      return conciliacao;
    });
  }

  buscarConciliacao(estabelecimentoId: number, provedor: string, transacaoExternaId: string) {
    return this.db.conciliacaoFinanceira.findUnique({
      where: { estabelecimentoId_provedor_transacaoExternaId: { estabelecimentoId, provedor, transacaoExternaId } },
    });
  }

  listarConciliacoes(estabelecimentoId: number) {
    return this.db.conciliacaoFinanceira.findMany({
      where: { estabelecimentoId },
      include: { contaFinanceira: { select: { id: true, descricao: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  buscarAssinatura(estabelecimentoId: number) {
    return this.db.assinaturaEstabelecimento.findUnique({
      where: { estabelecimentoId },
      include: { plano: true, cobrancas: { orderBy: { vencimento: 'desc' }, take: 20 } },
    });
  }

  async criarCobranca(estabelecimentoId: number, usuarioId: number, referenciaExterna: string, vencimento: Date) {
    return this.db.$transaction(async (tx: any) => {
      const assinatura = await tx.assinaturaEstabelecimento.findUnique({ where: { estabelecimentoId }, include: { plano: true } });
      if (!assinatura) return null;
      const existente = await tx.cobrancaAssinatura.findFirst({ where: { assinaturaId: assinatura.id, status: 'PENDENTE' } });
      const cobranca = existente ?? await tx.cobrancaAssinatura.create({
        data: { assinaturaId: assinatura.id, provedor: 'MANUAL', referenciaExterna, valor: assinatura.plano.precoMensal, vencimento },
      });
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_SUBSCRIPTION_CHARGE_CREATED', 'CobrancaAssinatura', cobranca.id, { referenciaExterna, vencimento });
      return cobranca;
    });
  }

  async registrarEvento(dados: any) {
    return this.db.$transaction(async (tx: any) => {
      const existente = await tx.eventoGatewayPagamento.findUnique({ where: { provedor_eventoExternoId: { provedor: dados.provedor, eventoExternoId: dados.eventoExternoId } } });
      if (existente) return { duplicado: true, evento: existente };
      const cobranca = await tx.cobrancaAssinatura.findUnique({ where: { referenciaExterna: dados.referenciaExterna }, include: { assinatura: true } });
      const evento = await tx.eventoGatewayPagamento.create({
        data: {
          estabelecimentoId: cobranca?.assinatura?.estabelecimentoId ?? null,
          provedor: dados.provedor,
          eventoExternoId: dados.eventoExternoId,
          tipo: dados.tipo,
          payload: dados.payload,
          status: cobranca ? 'PROCESSADO' : 'IGNORADO',
          processadoEm: new Date(),
          erro: cobranca ? null : 'Cobrança não encontrada',
        },
      });
      if (!cobranca) return { duplicado: false, evento };
      const pago = dados.status === 'PAGO';
      await tx.cobrancaAssinatura.update({
        where: { id: cobranca.id },
        data: { status: dados.status, pagoEm: pago ? new Date(dados.pagoEm ?? Date.now()) : null, tentativas: { increment: 1 } },
      });
      if (pago) {
        await tx.assinaturaEstabelecimento.update({ where: { id: cobranca.assinaturaId }, data: { status: 'ACTIVE' } });
        await tx.estabelecimento.update({ where: { id: cobranca.assinatura.estabelecimentoId }, data: { status: 'ACTIVE' } });
      }
      return { duplicado: false, evento };
    });
  }

  async processarInadimplencia(agora: Date, usuarioId: number) {
    const vencidas = await this.db.cobrancaAssinatura.findMany({
      where: { status: 'PENDENTE', vencimento: { lt: agora } },
      include: { assinatura: true },
    });
    return this.db.$transaction(async (tx: any) => {
      for (const cobranca of vencidas) {
        await tx.cobrancaAssinatura.update({ where: { id: cobranca.id }, data: { status: 'ATRASADA' } });
        await tx.assinaturaEstabelecimento.update({ where: { id: cobranca.assinaturaId }, data: { status: 'PAST_DUE' } });
        await tx.estabelecimento.update({ where: { id: cobranca.assinatura.estabelecimentoId }, data: { status: 'PAST_DUE' } });
        await auditarFinanceiro(tx, cobranca.assinatura.estabelecimentoId, usuarioId, 'FINANCIAL_SUBSCRIPTION_PAST_DUE', 'CobrancaAssinatura', cobranca.id, { vencimento: cobranca.vencimento });
      }
      return { processadas: vencidas.length };
    });
  }
}
