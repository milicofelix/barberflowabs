import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { auditarFinanceiro } from './auditoria-financeira';

@Injectable()
export class RepasseRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any { return this.prisma as any; }

  listar(estabelecimentoId: number, inicio: Date, fim: Date) {
    return this.db.repasseFinanceiro.findMany({
      where: { estabelecimentoId, periodoFim: { gte: inicio, lte: fim } },
      include: { profissional: { select: { id: true, nome: true } } },
      orderBy: { periodoFim: 'desc' },
    });
  }

  agendamentos(estabelecimentoId: number, inicio: Date, fim: Date) {
    return this.db.agendamento.findMany({
      where: { estabelecimentoId, status: 'CONCLUIDO', data: { gte: inicio, lte: fim } },
      select: {
        id: true,
        profissionalId: true,
        itens: { select: { servicoId: true, preco: true } },
        servicos: { select: { id: true, preco: true } },
      },
    });
  }

  salvar(estabelecimentoId: number, usuarioId: number, inicio: Date, fim: Date, repasses: any[]) {
    return this.db.$transaction(async (tx: any) => {
      const salvos = [];
      await tx.repasseFinanceiro.deleteMany({ where: { estabelecimentoId, periodoInicio: inicio, periodoFim: fim, status: 'PENDENTE' } });
      for (const repasse of repasses) {
        const chave = { estabelecimentoId, profissionalId: repasse.profissionalId, periodoInicio: inicio, periodoFim: fim };
        const existente = await tx.repasseFinanceiro.findUnique({
          where: { estabelecimentoId_profissionalId_periodoInicio_periodoFim: chave },
        });
        if (existente?.status === 'PAGO') { salvos.push(existente); continue; }
        salvos.push(await tx.repasseFinanceiro.upsert({
          where: { estabelecimentoId_profissionalId_periodoInicio_periodoFim: chave },
          update: repasse,
          create: { estabelecimentoId, periodoInicio: inicio, periodoFim: fim, ...repasse },
        }));
      }
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_TRANSFERS_CALCULATED', 'RepasseFinanceiro', null, { inicio, fim, quantidade: salvos.length });
      return salvos;
    });
  }

  buscar(id: number, estabelecimentoId: number) {
    return this.db.repasseFinanceiro.findFirst({ where: { id, estabelecimentoId } });
  }

  pagar(id: number, estabelecimentoId: number, usuarioId: number) {
    return this.db.$transaction(async (tx: any) => {
      const repasse = await tx.repasseFinanceiro.update({ where: { id }, data: { status: 'PAGO', pagoEm: new Date() } });
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_TRANSFER_PAID', 'RepasseFinanceiro', id, { valor: repasse.valorLiquido });
      return repasse;
    });
  }
}
