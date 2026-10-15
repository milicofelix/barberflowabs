import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

@Injectable()
export class AuditoriaRelacionamentoRepository {
  constructor(private readonly prisma: PrismaService) {}
  async listar(estabelecimentoId: number, cursor: number) {
    const itens = await this.prisma.logAuditoria.findMany({ where: { estabelecimentoId, id: { gt: cursor }, OR: ['RELACIONAMENTO_', 'CAMPANHA_', 'FIDELIDADE_', 'PRIVACIDADE_'].map((prefixo) => ({ acao: { startsWith: prefixo } })) }, orderBy: { id: 'asc' }, take: 100, select: { id: true, usuarioId: true, acao: true, entidade: true, entidadeId: true, createdAt: true } });
    return { itens, proximoCursor: itens.length === 100 ? itens[itens.length - 1].id : null };
  }
}
