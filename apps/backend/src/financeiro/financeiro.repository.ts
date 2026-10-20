import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { auditarFinanceiro } from './auditoria-financeira';

@Injectable()
export class FinanceiroRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma as any;
  }

  listarComissoes(estabelecimentoId: number) {
    return this.db.configuracaoComissao.findMany({
      where: { estabelecimentoId },
      include: {
        profissional: { select: { id: true, nome: true } },
        servico: { select: { id: true, nome: true } },
      },
      orderBy: { chave: 'asc' },
    });
  }

  salvarComissao(estabelecimentoId: number, usuarioId: number, chave: string, dados: any) {
    return this.db.$transaction(async (tx: any) => {
      const configuracao = await tx.configuracaoComissao.upsert({
        where: { estabelecimentoId_chave: { estabelecimentoId, chave } },
        update: dados,
        create: { estabelecimentoId, chave, ...dados },
      });
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_COMMISSION_SAVED', 'ConfiguracaoComissao', configuracao.id, dados);
      return configuracao;
    });
  }

  async validarEntidadesComissao(estabelecimentoId: number, profissionalId?: number, servicoId?: number) {
    const [profissional, servico] = await Promise.all([
      profissionalId ? this.db.profissional.findFirst({ where: { id: profissionalId, estabelecimentoId }, select: { id: true } }) : true,
      servicoId ? this.db.servico.findFirst({ where: { id: servicoId, estabelecimentoId }, select: { id: true } }) : true,
    ]);
    return Boolean(profissional && servico);
  }

  listarFormasPagamento(estabelecimentoId: number) {
    return this.db.formaPagamento.findMany({ where: { estabelecimentoId }, orderBy: { nome: 'asc' } });
  }

  salvarFormaPagamento(estabelecimentoId: number, usuarioId: number, dados: any, id?: number) {
    return this.db.$transaction(async (tx: any) => {
      const existente = id ? await tx.formaPagamento.findFirst({ where: { id, estabelecimentoId } }) : null;
      if (id && !existente) return null;
      const forma = id
        ? await tx.formaPagamento.update({ where: { id }, data: dados })
        : await tx.formaPagamento.create({ data: { estabelecimentoId, ...dados } });
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_PAYMENT_METHOD_SAVED', 'FormaPagamento', id ?? forma.id, dados);
      return forma;
    });
  }

  listarContas(estabelecimentoId: number, filtros: any) {
    const filtroStatus = filtros.status === 'ATRASADO'
      ? { status: 'PENDENTE', vencimento: { gte: filtros.inicio, lte: new Date(Math.min(Date.now(), filtros.fim.getTime())) } }
      : {
          ...(filtros.status ? { status: filtros.status } : {}),
          vencimento: { gte: filtros.inicio, lte: filtros.fim },
        };
    return this.db.contaFinanceira.findMany({
      where: {
        estabelecimentoId,
        ...(filtros.tipo ? { tipo: filtros.tipo } : {}),
        ...filtroStatus,
      },
      include: { formaPagamento: true, agendamento: { select: { id: true, data: true } } },
      orderBy: [{ vencimento: 'asc' }, { id: 'asc' }],
    });
  }

  criarConta(estabelecimentoId: number, usuarioId: number, dados: any) {
    return this.db.$transaction(async (tx: any) => {
      if (dados.agendamentoId && dados.tipo === 'RECEBER') {
        await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id = ${estabelecimentoId} FOR UPDATE`;
        await tx.$queryRaw`SELECT id FROM agendamentos WHERE id = ${dados.agendamentoId} AND estabelecimentoId = ${estabelecimentoId} FOR UPDATE`;
        const beneficio = await tx.beneficioFidelidade.findFirst({ where: { agendamentoId: dados.agendamentoId, agendamento: { estabelecimentoId }, status: { in: ['APLICADO', 'CONSUMIDO'] } } });
        if (beneficio) throw new ConflictException('Atendimento com benefício deve gerar a conta pela conclusão, respeitando o desconto');
      }
      const conta = await tx.contaFinanceira.create({ data: { estabelecimentoId, ...dados } });
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_ACCOUNT_CREATED', 'ContaFinanceira', conta.id, dados);
      return conta;
    }, { isolationLevel: 'ReadCommitted' });
  }

  async registrarReceitaAgendamento(estabelecimentoId: number, usuarioId: number | null, agendamento: any) {
    try {
      return await this.db.$transaction(async (tx: any) => {
        await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id = ${estabelecimentoId} FOR UPDATE`;
        const existente = await tx.contaFinanceira.findUnique({ where: { agendamentoId: agendamento.id } });
        if (existente) return existente;
        const valorInformado = Number(agendamento.valorTotal ?? 0);
        const valorServicos = (agendamento.servicos ?? []).reduce((total: number, servico: any) => total + Number(servico.preco), 0);
        const liquidacao = await tx.liquidacaoFidelidade.findUnique({ where: { agendamentoId: agendamento.id } });
        const valorTotal = liquidacao ? Number(liquidacao.liquidoCentavos) / 100 : valorInformado > 0 ? valorInformado : valorServicos;
        if (valorTotal <= 0) return null;
        const conta = await tx.contaFinanceira.create({
          data: {
            estabelecimentoId,
            agendamentoId: agendamento.id,
            tipo: 'RECEBER',
            categoria: 'ATENDIMENTO',
            descricao: `Atendimento #${agendamento.id}`,
            valorOriginal: valorTotal,
            competencia: agendamento.data,
            vencimento: new Date(),
          },
        });
        await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_APPOINTMENT_RECEIVABLE_CREATED', 'ContaFinanceira', conta.id, { agendamentoId: agendamento.id });
        return conta;
      });
    } catch (erro: any) {
      if (erro?.code === 'P2002') return this.db.contaFinanceira.findUnique({ where: { agendamentoId: agendamento.id } });
      throw erro;
    }
  }

  buscarConta(id: number, estabelecimentoId: number) {
    return this.db.contaFinanceira.findFirst({ where: { id, estabelecimentoId } });
  }

  async validarReferenciasConta(estabelecimentoId: number, agendamentoId?: number, formaPagamentoId?: number) {
    const [agendamento, forma] = await Promise.all([
      agendamentoId ? this.db.agendamento.findFirst({ where: { id: agendamentoId, estabelecimentoId }, select: { id: true } }) : true,
      formaPagamentoId ? this.db.formaPagamento.findFirst({ where: { id: formaPagamentoId, estabelecimentoId }, select: { id: true } }) : true,
    ]);
    return Boolean(agendamento && forma);
  }

  baixarConta(id: number, estabelecimentoId: number, usuarioId: number, dados: any) {
    return this.db.$transaction(async (tx: any) => {
      const { valorAnterior, ...alteracoes } = dados;
      const resultado = await tx.contaFinanceira.updateMany({
        where: { id, estabelecimentoId, valorPago: valorAnterior },
        data: alteracoes,
      });
      if (resultado.count !== 1) throw new ConflictException('A conta foi alterada por outra operação. Atualize e tente novamente');
      const conta = await tx.contaFinanceira.findUnique({ where: { id } });
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_ACCOUNT_SETTLED', 'ContaFinanceira', id, dados);
      return conta;
    });
  }

  cancelarConta(id: number, estabelecimentoId: number, usuarioId: number) {
    return this.db.$transaction(async (tx: any) => {
      const conta = await tx.contaFinanceira.update({ where: { id }, data: { status: 'CANCELADO' } });
      await auditarFinanceiro(tx, estabelecimentoId, usuarioId, 'FINANCIAL_ACCOUNT_CANCELED', 'ContaFinanceira', id, {});
      return conta;
    });
  }

  resumo(estabelecimentoId: number, inicio: Date, fim: Date) {
    return Promise.all([
      this.db.contaFinanceira.groupBy({ by: ['tipo', 'status'], where: { estabelecimentoId, vencimento: { gte: inicio, lte: fim } }, _sum: { valorOriginal: true, valorPago: true }, _count: true }),
      this.db.repasseFinanceiro.aggregate({ where: { estabelecimentoId, status: 'PENDENTE' }, _sum: { valorLiquido: true }, _count: true }),
      this.db.conciliacaoFinanceira.aggregate({ where: { estabelecimentoId, status: { not: 'CONCILIADO' } }, _sum: { diferenca: true }, _count: true }),
    ]);
  }

  auditoria(estabelecimentoId: number) {
    return this.db.logAuditoria.findMany({
      where: { estabelecimentoId, acao: { startsWith: 'FINANCIAL_' } },
      include: { usuario: { select: { id: true, nome: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

}
