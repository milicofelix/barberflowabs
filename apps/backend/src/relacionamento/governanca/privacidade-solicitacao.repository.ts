import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { inteiro, texto } from '../fidelidade/fidelidade.dto';
import { auditarGovernanca } from './retencao-relacionamento.repository';
import { confirmarAcao } from './governanca.dto';

export async function obterSolicitacaoPrivacidade(tx: any, estabelecimentoId: number, id: number) {
  const s = await tx.solicitacaoPrivacidade.findFirst({ where: { id, estabelecimentoId }, include: { cliente: { select: { id: true, usuarioId: true, estabelecimentoId: true } } } });
  if (!s || s.cliente.estabelecimentoId !== estabelecimentoId) throw new NotFoundException('Solicitação não encontrada');
  return s;
}

@Injectable()
export class PrivacidadeSolicitacaoRepository {
  constructor(private readonly prisma: PrismaService) {}
  listar(estabelecimentoId: number, cursor: number) { return (this.prisma as any).solicitacaoPrivacidade.findMany({ where: { estabelecimentoId, id: { gt: cursor } }, orderBy: { id: 'asc' }, take: 50 }); }

  criar(estabelecimentoId: number, usuarioId: number, dados: { clienteId: number; tipo: string; chaveIdempotencia: string }) {
    const clienteId = inteiro(dados?.clienteId); const chave = texto(dados?.chaveIdempotencia, 100);
    if (!['EXPORTACAO', 'EXCLUSAO'].includes(dados.tipo)) throw new ConflictException('Tipo deve ser EXPORTACAO ou EXCLUSAO');
    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id=${estabelecimentoId} FOR UPDATE`;
      if (!await tx.clienteEstabelecimento.findFirst({ where: { id: clienteId, estabelecimentoId } })) throw new NotFoundException('Cliente não encontrado');
      const existente = await tx.solicitacaoPrivacidade.findUnique({ where: { estabelecimentoId_chave: { estabelecimentoId, chave } } });
      if (existente) {
        if (existente.clienteId !== clienteId || existente.tipo !== dados.tipo) throw new ConflictException('Chave já usada para outra solicitação');
        return existente;
      }
      const solicitacao = await tx.solicitacaoPrivacidade.create({ data: { estabelecimentoId, clienteId, tipo: dados.tipo, chave, solicitadoPorId: usuarioId } });
      await auditarGovernanca(tx, estabelecimentoId, usuarioId, 'PRIVACIDADE_SOLICITADA', solicitacao.id, { tipo: dados.tipo, clienteId });
      return solicitacao;
    }, { isolationLevel: 'ReadCommitted' });
  }

  validarIdentidade(estabelecimentoId: number, usuarioId: number, id: number, referencia: string) {
    const referenciaVerificacao = texto(referencia, 150);
    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id=${estabelecimentoId} FOR UPDATE`;
      const s = await obterSolicitacaoPrivacidade(tx, estabelecimentoId, id);
      if (s.identidadeValidadaEm) return s;
      const atual = await tx.solicitacaoPrivacidade.update({ where: { id }, data: { identidadeValidadaEm: new Date(), validadoPorId: usuarioId, referenciaVerificacao, status: 'IDENTIDADE_VALIDADA' } });
      await auditarGovernanca(tx, estabelecimentoId, usuarioId, 'PRIVACIDADE_IDENTIDADE_VALIDADA', id);
      return atual;
    }, { isolationLevel: 'ReadCommitted' });
  }

  concluirExportacao(estabelecimentoId: number, usuarioId: number, id: number, d: { confirmacao: string; referenciaEntrega: string }) {
    confirmarAcao(d?.confirmacao, 'CONFIRMAR_ENTREGA_AO_TITULAR');
    const referenciaEntrega = texto(d.referenciaEntrega, 150);
    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id=${estabelecimentoId} FOR UPDATE`;
      const s = await obterSolicitacaoPrivacidade(tx, estabelecimentoId, id);
      if (s.tipo !== 'EXPORTACAO' || !s.identidadeValidadaEm) throw new ConflictException('Solicitação de exportação sem identidade validada');
      if (s.concluidaEm) return s;
      const atual = await tx.solicitacaoPrivacidade.update({ where: { id }, data: { status: 'ATENDIDA', concluidaEm: new Date(), resultado: { referenciaEntrega, entregaConfirmadaPeloOperador: true } } });
      await auditarGovernanca(tx, estabelecimentoId, usuarioId, 'PRIVACIDADE_EXPORTACAO_ENTREGUE', id);
      return atual;
    }, { isolationLevel: 'ReadCommitted' });
  }
}
