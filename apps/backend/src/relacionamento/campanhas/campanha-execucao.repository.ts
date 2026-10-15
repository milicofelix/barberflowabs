import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { DescadastroCampanhaService } from './descadastro-campanha.service';
import { STATUS_ENVIO_PENDENTE_CAMPANHA } from './campanha.dto';

@Injectable()
export class CampanhaExecucaoRepository {
  constructor(private readonly prisma: PrismaService, private readonly descadastro: DescadastroCampanhaService) {}
  private get db(): any { return this.prisma; }
  async processarLote(agora = new Date()) {
    const campanhas = await this.db.campanhaComunicacao.findMany({ where: { status: { in: ['AGENDADA', 'EM_EXECUCAO'] }, agendadoPara: { lte: agora } }, select: { id: true }, orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }], take: 5 });
    for (const campanha of campanhas) await this.processar(campanha.id, agora);
    return { verificadas: campanhas.length };
  }
  private async processar(id: number, agora: Date) {
    const origem = await this.db.campanhaComunicacao.findUnique({ where: { id }, select: { estabelecimentoId: true } });
    if (!origem) return;
    return this.db.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id=${origem.estabelecimentoId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM campanhas_comunicacao WHERE id = ${id} FOR UPDATE`;
      const campanha = await tx.campanhaComunicacao.findUnique({ where: { id }, include: { estabelecimento: { select: { nome: true, nomePublico: true } } } });
      if (!campanha || !['AGENDADA', 'EM_EXECUCAO'].includes(campanha.status) || campanha.agendadoPara > agora) return;
      const statusAnterior = campanha.status;
      await tx.campanhaComunicacao.update({ where: { id }, data: { status: 'EM_EXECUCAO', updatedAt: agora } });
      if (statusAnterior === 'AGENDADA') await this.auditar(tx, campanha, 'CAMPANHA_EXECUCAO_INICIADA');
      const destinatarios = await tx.campanhaDestinatario.findMany({ where: { campanhaId: id, status: 'PENDENTE' }, orderBy: { id: 'asc' }, take: 25 });
      for (const destinatario of destinatarios) {
        await tx.$queryRaw`SELECT id FROM clientes_estabelecimentos WHERE estabelecimentoId = ${campanha.estabelecimentoId} AND usuarioId = ${destinatario.usuarioId} FOR UPDATE`;
        const contexto = await this.contexto(tx, campanha, destinatario.usuarioId);
        let motivo = contexto.motivo;
        if (!motivo) {
          const recente = await tx.envioComunicacao.findFirst({ where: { estabelecimentoId: campanha.estabelecimentoId, usuarioId: destinatario.usuarioId, canal: campanha.templateSnapshot.canal, campanhaId: { not: null }, status: { in: [...STATUS_ENVIO_PENDENTE_CAMPANHA, 'ENVIADO'] }, createdAt: { gte: new Date(agora.getTime() - campanha.intervaloMinimoHoras * 3600000) } }, select: { id: true } });
          if (recente) motivo = 'LIMITE_FREQUENCIA';
        }
        if (motivo) {
          await tx.campanhaDestinatario.update({ where: { id: destinatario.id }, data: { status: 'SUPRIMIDO', motivo } });
          continue;
        }
        const url = this.descadastro.url(campanha.estabelecimentoId, destinatario.usuarioId, campanha.templateSnapshot.canal);
        const variaveis = { nome: contexto.cliente.usuario.nome, estabelecimento: campanha.estabelecimento.nomePublico || campanha.estabelecimento.nome, descadastroUrl: url };
        const renderizar = (texto?: string) => texto?.replace(/{{\s*([\w.-]+)\s*}}/g, (_, chave) => String(variaveis[chave] ?? '')) ?? null;
        const conteudo = `${renderizar(campanha.templateSnapshot.conteudo)}\n\nPara deixar de receber campanhas: ${url}`;
        const envio = await tx.envioComunicacao.create({ data: {
          estabelecimentoId: campanha.estabelecimentoId, usuarioId: destinatario.usuarioId, campanhaId: id, templateId: campanha.templateId,
          canal: campanha.templateSnapshot.canal, tipo: 'CAMPANHA', destinatario: contexto.destino, assunto: renderizar(campanha.templateSnapshot.assunto), conteudo,
          status: 'AGENDADO', agendadoPara: agora, chaveIdempotencia: `campanha:${id}:usuario:${destinatario.usuarioId}`, metadados: { origem: 'CAMPANHA', campanhaId: id },
        } });
        await tx.campanhaDestinatario.update({ where: { id: destinatario.id }, data: { status: 'ENFILEIRADO', envioId: envio.id } });
      }
      const pendentes = await tx.campanhaDestinatario.count({ where: { campanhaId: id, status: 'PENDENTE' } });
      const envios = await tx.envioComunicacao.count({ where: { campanhaId: id, status: { in: STATUS_ENVIO_PENDENTE_CAMPANHA } } });
      if (!pendentes && !envios) {
        await tx.campanhaComunicacao.update({ where: { id }, data: { status: 'CONCLUIDA', concluidaEm: agora } });
        await this.auditar(tx, campanha, 'CAMPANHA_CONCLUIDA');
      }
    }, { timeout: 20000, isolationLevel: 'ReadCommitted' });
  }
  /** Última verificação antes da chamada ao provedor; não concede consentimento. */
  async autorizar(envio: any, agora = new Date()) {
    if (!envio.campanhaId && envio.tipo !== 'CAMPANHA') return true;
    return this.db.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT id FROM estabelecimentos WHERE id=${envio.estabelecimentoId} FOR UPDATE`;
      if (envio.campanhaId) await tx.$queryRaw`SELECT id FROM campanhas_comunicacao WHERE id = ${envio.campanhaId} AND estabelecimentoId = ${envio.estabelecimentoId} FOR UPDATE`;
      const campanha = envio.campanhaId ? await tx.campanhaComunicacao.findFirst({ where: { id: envio.campanhaId, estabelecimentoId: envio.estabelecimentoId } }) : null;
      const where = { id: envio.id, status: 'PROCESSANDO', bloqueadoPor: envio.bloqueadoPor };
      const atual = await tx.envioComunicacao.findFirst({ where });
      if (!atual) return false;
      if (campanha && ['PAUSADA', 'AGENDADA'].includes(campanha.status)) {
        await tx.envioComunicacao.updateMany({ where, data: { status: 'AGENDADO', agendadoPara: new Date(agora.getTime() + 60000), bloqueadoEm: null, bloqueadoPor: null } });
        return false;
      }
      const contexto = campanha && Number.isSafeInteger(envio.usuarioId) ? await this.contexto(tx, campanha, envio.usuarioId) : { motivo: 'CLIENTE_OU_CAMPANHA_INEXISTENTE', destino: null };
      let motivo = contexto.motivo;
      if (!campanha || campanha.status !== 'EM_EXECUCAO') motivo = 'CAMPANHA_NAO_ATIVA';
      if (!motivo && contexto.destino !== envio.destinatario) motivo = 'DESTINO_ALTERADO_REQUER_NOVA_CAMPANHA';
      if (!motivo) {
        const [preferenciaAtual] = await tx.$queryRaw`SELECT consentido, revogadoEm FROM preferencias_comunicacao WHERE estabelecimentoId = ${envio.estabelecimentoId} AND usuarioId = ${envio.usuarioId} AND canal = ${envio.canal} FOR UPDATE`;
        if (!preferenciaAtual?.consentido || preferenciaAtual.revogadoEm) motivo = 'SEM_CONSENTIMENTO';
      }
      if (!motivo) {
        const chave = { estabelecimentoId: envio.estabelecimentoId, usuarioId: envio.usuarioId, canal: envio.canal };
        await tx.supressaoComunicacao.upsert({ where: { estabelecimentoId_usuarioId_canal: chave }, create: { ...chave, ativa: false, motivo: 'CONTROLE_FREQUENCIA' }, update: {} });
        const [controle] = await tx.$queryRaw`SELECT ativa, ultimoDisparoEm, ultimoEnvioId, intervaloReservadoHoras FROM supressoes_comunicacao WHERE estabelecimentoId = ${envio.estabelecimentoId} AND usuarioId = ${envio.usuarioId} AND canal = ${envio.canal} FOR UPDATE`;
        if (controle?.ativa) motivo = 'SUPRESSAO_ATIVA';
        else if (controle?.ultimoEnvioId !== envio.id && controle?.ultimoDisparoEm && controle.ultimoDisparoEm.getTime() > agora.getTime() - Math.max(campanha.intervaloMinimoHoras, controle.intervaloReservadoHoras || 24) * 3600000) motivo = 'LIMITE_FREQUENCIA';
        const recente = await tx.envioComunicacao.findFirst({ where: { estabelecimentoId: envio.estabelecimentoId, usuarioId: envio.usuarioId, canal: envio.canal, id: { not: envio.id }, campanhaId: { not: null }, status: 'ENVIADO', enviadoEm: { gte: new Date(agora.getTime() - campanha.intervaloMinimoHoras * 3600000) } }, select: { id: true } });
        if (recente) motivo = 'LIMITE_FREQUENCIA';
        if (!motivo) await tx.supressaoComunicacao.update({ where: { estabelecimentoId_usuarioId_canal: chave }, data: { ultimoDisparoEm: controle?.ultimoEnvioId === envio.id ? controle.ultimoDisparoEm : agora, ultimoEnvioId: envio.id, intervaloReservadoHoras: campanha.intervaloMinimoHoras } });
      }
      if (motivo) await tx.envioComunicacao.updateMany({ where, data: { status: 'CANCELADO', erro: motivo, bloqueadoEm: null, bloqueadoPor: null } });
      return !motivo;
    }, { isolationLevel: 'ReadCommitted' });
  }
  private async contexto(tx: any, campanha: any, usuarioId: number) {
    const canal = campanha.templateSnapshot?.canal;
    const chave = { estabelecimentoId: campanha.estabelecimentoId, usuarioId, canal };
    const [cliente, preferencia, supressao] = await Promise.all([
      tx.clienteEstabelecimento.findFirst({ where: { estabelecimentoId: campanha.estabelecimentoId, usuarioId, status: 'ATIVO' }, include: { usuario: { select: { nome: true, email: true, emailContato: true, emailTecnico: true, telefone: true } } } }),
      tx.preferenciaComunicacao.findUnique({ where: { estabelecimentoId_usuarioId_canal: chave } }),
      tx.supressaoComunicacao.findUnique({ where: { estabelecimentoId_usuarioId_canal: chave } }),
    ]);
    const usuario = cliente?.usuario;
    const destino = canal === 'EMAIL' ? (usuario?.emailTecnico ? null : usuario?.emailContato || usuario?.email) : canal === 'WHATSAPP' ? usuario?.telefone : cliente ? `push:usuario:${usuarioId}` : null;
    const motivo = !cliente ? 'CLIENTE_INATIVO_OU_REMOVIDO' : !preferencia?.consentido || preferencia.revogadoEm ? 'SEM_CONSENTIMENTO' : supressao?.ativa ? 'SUPRESSAO_ATIVA' : !destino ? 'SEM_DESTINO' : null;
    return { cliente, destino, motivo };
  }
  private auditar(tx: any, campanha: any, acao: string) {
    return tx.logAuditoria.create({ data: { estabelecimentoId: campanha.estabelecimentoId, acao, entidade: 'CampanhaComunicacao', entidadeId: String(campanha.id), detalhes: {} } });
  }
}
