import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { NivelFidelidade } from './fidelidade.dto';

@Injectable()
export class CarteiraFidelidadeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async cliente(tx: any, estabelecimentoId: number, clienteId: number, ativo = true) {
    const cliente = await tx.clienteEstabelecimento.findFirst({ where: { id: clienteId, estabelecimentoId, ...(ativo ? { status: 'ATIVO' } : {}) }, include: { usuario: { select: { id: true, email: true, telefone: true, papel: true } } } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado neste estabelecimento');
    return cliente;
  }

  async bloquear(tx: any, clienteId: number) {
    await tx.carteiraFidelidade.upsert({ where: { clienteId }, create: { clienteId }, update: {} });
    await tx.$queryRaw`SELECT clienteId FROM carteiras_fidelidade WHERE clienteId = ${clienteId} FOR UPDATE`;
  }

  async lotes(tx: any, clienteId: number, agora: Date) {
    const creditos = await tx.movimentoFidelidade.findMany({
      where: { clienteId, creditoId: null, pontos: { gt: 0 }, expiraEm: { gt: agora } },
      include: { consumos: { select: { pontos: true } } }, orderBy: [{ expiraEm: 'asc' }, { id: 'asc' }],
    });
    return creditos.map((c: any) => ({ id: c.id, expiraEm: c.expiraEm, saldo: c.pontos + c.consumos.reduce((s: number, m: any) => s + m.pontos, 0) })).filter((c: any) => c.saldo > 0);
  }

  async creditar(tx: any, clienteId: number, pontos: number, chave: string, tipo: string, validadeDias: number, detalhes: object, agora: Date) {
    if (pontos <= 0) return;
    await tx.movimentoFidelidade.create({ data: { clienteId, pontos, chave, tipo, detalhes, expiraEm: new Date(agora.getTime() + validadeDias * 86400000) } });
  }

  async debitar(tx: any, clienteId: number, pontos: number, beneficioId: number, agora: Date) {
    const lotes = await this.lotes(tx, clienteId, agora);
    if (lotes.reduce((s: number, c: any) => s + c.saldo, 0) < pontos) throw new ConflictException('Saldo de pontos insuficiente ou expirado');
    let restante = pontos;
    for (const lote of lotes) {
      if (!restante) break;
      const consumo = Math.min(restante, lote.saldo);
      await tx.movimentoFidelidade.create({ data: { clienteId, pontos: -consumo, creditoId: lote.id, beneficioId, tipo: 'RESGATE', chave: `resgate:${beneficioId}:${lote.id}`, detalhes: { validadeOriginal: lote.expiraEm.toISOString() } } });
      restante -= consumo;
    }
  }

  async estornar(tx: any, beneficio: any) {
    const debitos = await tx.movimentoFidelidade.findMany({ where: { beneficioId: beneficio.id, tipo: 'RESGATE' } });
    for (const d of debitos) await tx.movimentoFidelidade.create({ data: {
      clienteId: d.clienteId, creditoId: d.creditoId, beneficioId: beneficio.id, pontos: -d.pontos,
      tipo: 'ESTORNO', chave: `estorno:${d.id}`, detalhes: { debitoId: d.id, motivo: 'Benefício cancelado; validade original preservada' },
    } });
  }

  async consultar(estabelecimentoId: number, clienteId: number, pagina = 1) {
    return this.prisma.$transaction(async (tx: any) => {
      await this.cliente(tx, estabelecimentoId, clienteId, false);
      await this.bloquear(tx, clienteId);
      const agora = new Date();
      const [lotes, ganhos, programa, extrato, total] = await Promise.all([
        this.lotes(tx, clienteId, agora),
        tx.movimentoFidelidade.aggregate({ where: { clienteId, tipo: { in: ['GANHO', 'INDICACAO'] } }, _sum: { pontos: true } }),
        tx.programaFidelidade.findUnique({ where: { estabelecimentoId } }),
        tx.movimentoFidelidade.findMany({ where: { clienteId }, orderBy: { id: 'desc' }, skip: (pagina - 1) * 50, take: 50 }),
        tx.movimentoFidelidade.count({ where: { clienteId } }),
      ]);
      const pontosAcumulados = ganhos._sum.pontos ?? 0;
      const niveis = (programa?.niveis ?? []) as NivelFidelidade[];
      const nivel = [...niveis].reverse().find((n) => n.pontos <= pontosAcumulados) ?? null;
      return { saldo: lotes.reduce((s: number, l: any) => s + l.saldo, 0), pontosAcumulados, nivel, lotes, extrato, pagina, limite: 50, total, calculadoEm: agora };
    }, { isolationLevel: 'ReadCommitted' });
  }
}

export function auditarFidelidade(tx: any, estabelecimentoId: number, usuarioId: number | null, acao: string, entidadeId: number, detalhes: object) {
  return tx.logAuditoria.create({ data: { estabelecimentoId, usuarioId, acao, entidade: 'Fidelidade', entidadeId: String(entidadeId), detalhes } });
}

/** O worker já bloqueia o estabelecimento; manter a mesma ordem evita inversão com FKs da auditoria. */
export function bloquearTenantFidelidade(tx: any, estabelecimentoId: number) {
  return tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id = ${estabelecimentoId} FOR UPDATE`;
}
