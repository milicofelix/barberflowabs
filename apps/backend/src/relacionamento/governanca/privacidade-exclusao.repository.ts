import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/db/prisma.service';
import { texto } from '../fidelidade/fidelidade.dto';
import { CANAIS_COMUNICACAO } from '../relacionamento.constants';
import { confirmarAcao } from './governanca.dto';
import { obterSolicitacaoPrivacidade } from './privacidade-solicitacao.repository';
import { auditarGovernanca, expurgarEnvios } from './retencao-relacionamento.repository';

@Injectable()
export class PrivacidadeExclusaoRepository {
  constructor(private readonly prisma: PrismaService) {}

  executar(estabelecimentoId: number, usuarioId: number, id: number, d: { confirmacao: string; motivoConservacao: string }) {
    confirmarAcao(d?.confirmacao, 'EXCLUIR_DADOS_RELACIONAMENTO');
    const motivoConservacao = texto(d.motivoConservacao, 500);
    return this.prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id=${estabelecimentoId} FOR UPDATE`;
      const s = await obterSolicitacaoPrivacidade(tx, estabelecimentoId, id);
      if (s.tipo !== 'EXCLUSAO' || !s.identidadeValidadaEm) throw new ConflictException('Exclusão exige solicitação própria e verificação de identidade');
      if (s.concluidaEm) return s;
      const agora = new Date(); const alvo = s.cliente.usuarioId;
      await tx.$queryRaw`SELECT id FROM clientes_estabelecimentos WHERE id=${s.clienteId} FOR UPDATE`;
      const envios = await tx.$queryRaw`SELECT id,status FROM envios_comunicacao WHERE estabelecimentoId=${estabelecimentoId} AND usuarioId=${alvo} ORDER BY id LIMIT 1001 FOR UPDATE`;
      if (envios.length > 1000) throw new ConflictException('Volume superior a mil mensagens: requer tratamento em lote pelo encarregado, sem exclusão parcial silenciosa');
      if (envios.some((e: any) => e.status === 'PROCESSANDO')) throw new ConflictException('Aguarde os envios em processamento terminarem e repita a solicitação');
      for (const canal of CANAIS_COMUNICACAO) {
        const chave = { estabelecimentoId, usuarioId: alvo, canal };
        await tx.preferenciaComunicacao.upsert({ where: { estabelecimentoId_usuarioId_canal: chave }, create: { ...chave, consentido: false, revogadoEm: agora, origem: 'SOLICITACAO_PRIVACIDADE' }, update: { consentido: false, revogadoEm: agora, origem: 'SOLICITACAO_PRIVACIDADE' } });
        await tx.supressaoComunicacao.upsert({ where: { estabelecimentoId_usuarioId_canal: chave }, create: { ...chave, ativa: true, motivo: 'SOLICITACAO_PRIVACIDADE' }, update: { ativa: true, motivo: 'SOLICITACAO_PRIVACIDADE' } });
      }
      await tx.envioComunicacao.updateMany({ where: { estabelecimentoId, usuarioId: alvo, status: { in: ['AGENDADO', 'RETENTATIVA'] } }, data: { status: 'CANCELADO' } });
      await expurgarEnvios(tx, estabelecimentoId, envios.map((e: any) => e.id), agora);
      await tx.campanhaDestinatario.updateMany({ where: { usuarioId: alvo, campanha: { estabelecimentoId } }, data: { evidencia: {}, motivo: 'PRIVACIDADE', status: 'SUPRIMIDO' } });
      await tx.lembreteRelacionamento.deleteMany({ where: { estabelecimentoId, usuarioId: alvo } });
      const importacoes = await tx.importacaoContatoItem.findMany({ where: { usuarioId: alvo, lote: { estabelecimentoId } }, select: { id: true }, take: 1001 });
      if (importacoes.length > 1000) throw new ConflictException('Histórico de importação requer tratamento em lote pelo encarregado');
      for (const item of importacoes) await tx.importacaoContatoItem.update({ where: { id: item.id }, data: { referencia: `expurgado:${item.id}`, fingerprint: randomUUID(), motivo: null } });
      await tx.clienteEstabelecimento.update({ where: { id: s.clienteId }, data: { tags: [], observacoes: null, status: 'BLOQUEADO', privacidadeRestritaEm: agora } });
      const resultado = { escopo: 'RELACIONAMENTO_DO_ESTABELECIMENTO', enviosExpurgados: envios.length, conservados: ['Conta global compartilhada e identidade de autenticação', 'Agendamentos, financeiro e fidelização vinculados', 'Evidências mínimas de consentimento, supressão e auditoria'], exclusaoIntegral: false, exigeRevisaoDoEncarregado: true };
      const atual = await tx.solicitacaoPrivacidade.update({ where: { id }, data: { status: 'ATENDIDA_PARCIAL', motivoConservacao, resultado, concluidaEm: agora } });
      await auditarGovernanca(tx, estabelecimentoId, usuarioId, 'PRIVACIDADE_EXCLUSAO_PARCIAL', id, { clienteId: s.clienteId, enviosExpurgados: envios.length });
      return atual;
    }, { isolationLevel: 'ReadCommitted', timeout: 20000 });
  }
}
