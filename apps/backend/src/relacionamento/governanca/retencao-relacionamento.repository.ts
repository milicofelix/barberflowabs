import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { confirmarAcao, validarPolitica } from './governanca.dto';

export function auditarGovernanca(tx: any, estabelecimentoId: number, usuarioId: number, acao: string, entidadeId: number, detalhes: object = {}) {
  return tx.logAuditoria.create({ data: { estabelecimentoId, usuarioId, acao, entidade: 'GovernancaRelacionamento', entidadeId: String(entidadeId), detalhes } });
}

/** Preserva evidência mínima dos eventos, retirando conteúdo, destino e payloads. */
export async function expurgarEnvios(tx: any, estabelecimentoId: number, ids: number[], agora: Date) {
  if (!ids.length) return;
  const where = { id: { in: ids }, estabelecimentoId };
  await tx.callbackEnvioComunicacao.updateMany({ where: { envio: where }, data: { payload: {}, erro: null } });
  await tx.tentativaEnvioComunicacao.updateMany({ where: { envio: where }, data: { resposta: {}, erro: null } });
  await tx.envioComunicacao.updateMany({ where, data: { destinatario: '[EXPURGADO]', assunto: null, conteudo: '[EXPURGADO]', metadados: {}, erro: null, dadosExpurgadosEm: agora } });
}

@Injectable()
export class RetencaoRelacionamentoRepository {
  constructor(private readonly prisma: PrismaService) {}
  private get db(): any { return this.prisma; }
  async obter(estabelecimentoId: number) { return await this.db.politicaRetencaoRelacionamento.findUnique({ where: { estabelecimentoId } }) ?? { estabelecimentoId, ativa: false, conteudoDias: 90, fundamento: null }; }

  salvar(estabelecimentoId: number, usuarioId: number, dados: { ativa: boolean; conteudoDias: number; fundamento: string }) {
    const config = validarPolitica(dados);
    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id=${estabelecimentoId} FOR UPDATE`;
      const politica = await tx.politicaRetencaoRelacionamento.upsert({ where: { estabelecimentoId }, create: { estabelecimentoId, aprovadaPorId: usuarioId, ...config }, update: { aprovadaPorId: usuarioId, ...config } });
      await auditarGovernanca(tx, estabelecimentoId, usuarioId, 'PRIVACIDADE_POLITICA_SALVA', estabelecimentoId, { ativa: config.ativa, conteudoDias: config.conteudoDias });
      return politica;
    });
  }

  executar(estabelecimentoId: number, usuarioId: number, confirmacao: string) {
    confirmarAcao(confirmacao, 'EXPURGAR_CONTEUDO_VENCIDO');
    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id=${estabelecimentoId} FOR UPDATE`;
      const politica = await tx.politicaRetencaoRelacionamento.findUnique({ where: { estabelecimentoId } });
      if (!politica?.ativa) throw new ConflictException('Política precisa ser aprovada e ativada antes da execução');
      const agora = new Date(); const corte = new Date(agora.getTime() - politica.conteudoDias * 86400000);
      const registros = await tx.$queryRaw`SELECT id FROM envios_comunicacao WHERE estabelecimentoId=${estabelecimentoId} AND dadosExpurgadosEm IS NULL AND createdAt<${corte} AND status IN ('ENVIADO','CANCELADO','FALHA_PERMANENTE','FILA_MORTA') ORDER BY id LIMIT 100 FOR UPDATE`;
      await expurgarEnvios(tx, estabelecimentoId, registros.map((r: any) => r.id), agora);
      await auditarGovernanca(tx, estabelecimentoId, usuarioId, 'PRIVACIDADE_RETENCAO_EXECUTADA', estabelecimentoId, { quantidade: registros.length, corte: corte.toISOString() });
      return { expurgados: registros.length, loteMaximo: 100, podeHaverMais: registros.length === 100, corte };
    }, { isolationLevel: 'ReadCommitted' });
  }
}
