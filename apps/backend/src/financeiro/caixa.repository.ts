import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { auditarFinanceiro } from './auditoria-financeira';

@Injectable()
export class CaixaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any { return this.prisma as any; }

  caixaAberto(estabelecimentoId: number) {
    return this.db.fechamentoCaixa.findFirst({ where: { estabelecimentoId, status: 'ABERTO' }, orderBy: { abertoEm: 'desc' } });
  }

  buscar(id: number, estabelecimentoId: number) {
    return this.db.fechamentoCaixa.findFirst({ where: { id, estabelecimentoId } });
  }

  listar(estabelecimentoId: number) {
    return this.db.fechamentoCaixa.findMany({
      where: { estabelecimentoId },
      include: { abertoPor: { select: { id: true, nome: true } }, fechadoPor: { select: { id: true, nome: true } } },
      orderBy: { abertoEm: 'desc' },
      take: 50,
    });
  }

  abrir(estabelecimentoId: number, usuarioId: number, dados: any) {
    return this.db.$transaction(async (tx: any) => {
      const caixa = await tx.fechamentoCaixa.create({ data: { estabelecimentoId, abertoPorId: usuarioId, ...dados } });
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_CASH_REGISTER_OPENED', 'FechamentoCaixa', caixa.id, dados);
      return caixa;
    });
  }

  totais(estabelecimentoId: number, inicio: Date, fim: Date) {
    return this.db.contaFinanceira.groupBy({
      by: ['tipo'],
      where: { estabelecimentoId, status: 'PAGO', pagoEm: { gte: inicio, lte: fim } },
      _sum: { valorPago: true },
    });
  }

  fechar(id: number, estabelecimentoId: number, usuarioId: number, dados: any) {
    return this.db.$transaction(async (tx: any) => {
      const caixa = await tx.fechamentoCaixa.update({ where: { id }, data: dados });
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_CASH_REGISTER_CLOSED', 'FechamentoCaixa', id, dados);
      return caixa;
    });
  }
}
