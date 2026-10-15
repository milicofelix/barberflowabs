import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { obterSolicitacaoPrivacidade } from './privacidade-solicitacao.repository';
import { auditarGovernanca } from './retencao-relacionamento.repository';

export const SECOES_EXPORTACAO = ['perfil', 'preferencias', 'supressoes', 'agendamentos', 'financeiro', 'fidelidade', 'beneficios', 'indicacoes', 'comunicacoes', 'campanhas', 'importacoes', 'lembretes', 'solicitacoes'] as const;

@Injectable()
export class PrivacidadeExportacaoRepository {
  constructor(private readonly prisma: PrismaService) {}
  async exportar(estabelecimentoId: number, operadorId: number, id: number, secao: string, cursor: number) {
    if (!SECOES_EXPORTACAO.includes(secao as any)) throw new BadRequestException(`Seção esperada: ${SECOES_EXPORTACAO.join(', ')}`);
    return this.prisma.$transaction(async (tx: any) => {
      const s = await obterSolicitacaoPrivacidade(tx, estabelecimentoId, id);
      if (s.tipo !== 'EXPORTACAO' || !s.identidadeValidadaEm) throw new ConflictException('Exportação exige verificação de identidade');
      const dados = await this.secao(tx, estabelecimentoId, s.clienteId, s.cliente.usuarioId, secao, cursor);
      await auditarGovernanca(tx, estabelecimentoId, operadorId, 'PRIVACIDADE_EXPORTACAO_ACESSADA', id, { secao, cursor, quantidade: Array.isArray(dados) ? dados.length : 1 });
      return { solicitacaoId: id, estabelecimentoId, secao, dados, limite: 100, proximoCursor: Array.isArray(dados) && dados.length === 100 ? dados[dados.length - 1].id : null, geradoEm: new Date(), escopo: 'Somente dados vinculados ao cliente neste estabelecimento; não inclui segredos, dados de outros titulares ou registros de outras unidades' };
    });
  }

  private secao(tx: any, estabelecimentoId: number, clienteId: number, usuarioId: number, secao: string, cursor: number) {
    const pagina = { orderBy: { id: 'asc' }, take: 100 }; const after = { id: { gt: cursor } };
    switch (secao) {
      case 'perfil': return tx.clienteEstabelecimento.findFirst({ where: { id: clienteId, estabelecimentoId }, select: { id: true, origem: true, status: true, tags: true, observacoes: true, createdAt: true, privacidadeRestritaEm: true, usuario: { select: { nome: true, email: true, emailContato: true, telefone: true, fotoURL: true, dataNascimento: true } } } });
      case 'preferencias': return tx.preferenciaComunicacao.findMany({ ...pagina, where: { estabelecimentoId, usuarioId, ...after }, select: { id: true, canal: true, consentido: true, origem: true, versaoTermos: true, consentidoEm: true, revogadoEm: true } });
      case 'supressoes': return tx.supressaoComunicacao.findMany({ ...pagina, where: { estabelecimentoId, usuarioId, ...after }, select: { id: true, canal: true, ativa: true, motivo: true, createdAt: true } });
      case 'agendamentos': return tx.agendamento.findMany({ ...pagina, where: { estabelecimentoId, usuarioId, ...after }, select: { id: true, data: true, dataFim: true, status: true, valorTotal: true, origem: true, itens: { select: { servicoId: true, preco: true, duracaoMinutos: true } } } });
      case 'financeiro': return tx.contaFinanceira.findMany({ ...pagina, where: { estabelecimentoId, agendamento: { usuarioId, estabelecimentoId }, ...after }, select: { id: true, agendamentoId: true, tipo: true, valorOriginal: true, valorPago: true, status: true, vencimento: true } });
      case 'fidelidade': return tx.movimentoFidelidade.findMany({ ...pagina, where: { clienteId, carteira: { cliente: { estabelecimentoId } }, ...after }, select: { id: true, tipo: true, pontos: true, creditoId: true, expiraEm: true, createdAt: true } });
      case 'beneficios': return tx.beneficioFidelidade.findMany({ ...pagina, where: { clienteId, agendamento: { estabelecimentoId }, ...after }, select: { id: true, agendamentoId: true, recompensaId: true, cupomId: true, descontoCentavos: true, pontos: true, status: true, createdAt: true } });
      case 'indicacoes': return tx.indicacaoFidelidade.findMany({ ...pagina, where: { OR: [{ indicadorId: clienteId }, { indicadoId: clienteId }], indicado: { cliente: { estabelecimentoId } }, ...after }, select: { id: true, status: true, bonusPontos: true, createdAt: true } });
      case 'comunicacoes': return tx.envioComunicacao.findMany({ ...pagina, where: { estabelecimentoId, usuarioId, ...after }, select: { id: true, canal: true, tipo: true, destinatario: true, assunto: true, conteudo: true, status: true, createdAt: true, enviadoEm: true, dadosExpurgadosEm: true } });
      case 'campanhas': return tx.campanhaDestinatario.findMany({ ...pagina, where: { usuarioId, campanha: { estabelecimentoId }, ...after }, select: { id: true, campanhaId: true, status: true, motivo: true, evidencia: true, createdAt: true } });
      case 'importacoes': return tx.importacaoContatoItem.findMany({ ...pagina, where: { usuarioId, lote: { estabelecimentoId }, ...after }, select: { id: true, referencia: true, resultado: true, motivo: true, createdAt: true } });
      case 'lembretes': return tx.lembreteRelacionamento.findMany({ ...pagina, where: { estabelecimentoId, usuarioId, ...after }, select: { id: true, tipo: true, canal: true, status: true, mensagem: true, dataPrevista: true } });
      case 'solicitacoes': return tx.solicitacaoPrivacidade.findMany({ ...pagina, where: { estabelecimentoId, clienteId, ...after }, select: { id: true, tipo: true, status: true, motivoConservacao: true, resultado: true, createdAt: true, concluidaEm: true } });
    }
  }
}
