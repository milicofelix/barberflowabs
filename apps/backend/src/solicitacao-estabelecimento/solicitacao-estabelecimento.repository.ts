import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { STATUS_SOLICITACAO_EDITAVEIS } from './solicitacao-estabelecimento.constants';
import { SalvarSolicitacaoEstabelecimentoDto } from './solicitacao-estabelecimento.dto';

const incluirSolicitacao = {
  usuario: { select: { id: true, nome: true, email: true, telefone: true } },
  segmentos: { include: { segmento: { select: { id: true, slug: true, nome: true } } }, orderBy: { id: 'asc' } },
  especialidades: { include: { especialidade: { select: { id: true, slug: true, nome: true } } }, orderBy: { id: 'asc' } },
} as const;

@Injectable()
export class SolicitacaoEstabelecimentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarDoUsuario(usuarioId: number) {
    return (this.prisma as any).solicitacaoEstabelecimento.findMany({
      where: { usuarioId }, include: incluirSolicitacao, orderBy: { updatedAt: 'desc' },
    });
  }

  buscarDoUsuario(id: number, usuarioId: number) {
    return (this.prisma as any).solicitacaoEstabelecimento.findFirst({
      where: { id, usuarioId }, include: incluirSolicitacao,
    });
  }

  async buscarDoUsuarioOuFalhar(id: number, usuarioId: number) {
    const solicitacao = await this.buscarDoUsuario(id, usuarioId);
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada');
    return solicitacao;
  }

  async criarOuObterRascunho(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { estabelecimentoId: true, membroEstabelecimento: true, papel: true },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    if (usuario.estabelecimentoId || usuario.membroEstabelecimento || ['ESTABLISHMENT_OWNER', 'ESTABLISHMENT_MEMBER'].includes(usuario.papel)) {
      const aprovada = await (this.prisma as any).solicitacaoEstabelecimento.findFirst({
        where: { usuarioId, status: 'APPROVED', estabelecimentoGeradoId: usuario.estabelecimentoId ?? undefined },
        include: incluirSolicitacao, orderBy: { revisadoEm: 'desc' },
      });
      if (aprovada) return aprovada;
      throw new ConflictException('Esta conta já está vinculada a um estabelecimento');
    }
    const chaveAtiva = `usuario:${usuarioId}`;
    return (this.prisma as any).solicitacaoEstabelecimento.upsert({
      where: { chaveAtiva }, update: {}, create: { usuarioId, chaveAtiva }, include: incluirSolicitacao,
    });
  }

  async listarPendentes() {
    const solicitacoes = await (this.prisma as any).solicitacaoEstabelecimento.findMany({
      where: { status: 'PENDING_REVIEW' }, include: incluirSolicitacao, orderBy: { enviadoEm: 'asc' },
    });
    return Promise.all(solicitacoes.map(async (solicitacao: any) => ({
      ...solicitacao,
      possiveisDuplicidades: await (this.prisma as any).estabelecimento.findMany({
        where: { OR: [
          { nomePublico: solicitacao.nomePublico }, { nome: solicitacao.nomePublico },
          ...(solicitacao.telefoneComercial ? [{ telefone: solicitacao.telefoneComercial }] : []),
          ...(solicitacao.logradouro && solicitacao.numero ? [{ endereco: { contains: `${solicitacao.logradouro}, ${solicitacao.numero}` } }] : []),
        ] }, select: { id: true, nome: true, slug: true, telefone: true, endereco: true }, take: 5,
      }),
    })));
  }

  buscarParaRevisao(id: number) {
    return (this.prisma as any).solicitacaoEstabelecimento.findUnique({ where: { id }, include: incluirSolicitacao });
  }

  async revisar(id: number, revisorId: number, decisao: 'APPROVED' | 'CORRECTION_REQUESTED' | 'REJECTED', motivo?: string) {
    return this.prisma.$transaction(async (tx) => {
      const solicitacao = await (tx as any).solicitacaoEstabelecimento.findUnique({ where: { id }, include: incluirSolicitacao });
      if (!solicitacao) throw new NotFoundException('Solicitação não encontrada');
      if (solicitacao.status !== 'PENDING_REVIEW') throw new ConflictException('Solicitação já foi revisada');

      let estabelecimentoId: number | null = null;
      if (decisao === 'APPROVED') estabelecimentoId = await this.materializar(tx as any, solicitacao, revisorId);

      await (tx as any).solicitacaoEstabelecimento.update({
        where: { id }, data: {
          status: decisao, revisorId, revisadoEm: new Date(), motivoRevisao: motivo || null,
          estabelecimentoGeradoId: estabelecimentoId, chaveAtiva: decisao === 'CORRECTION_REQUESTED' ? solicitacao.chaveAtiva : null,
          versao: { increment: 1 },
        },
      });
      const mensagens = {
        APPROVED: ['Cadastro aprovado', 'Seu estabelecimento foi aprovado e já pode ser configurado.'],
        CORRECTION_REQUESTED: ['Ajustes solicitados', motivo || 'Revise os dados do estabelecimento e envie novamente.'],
        REJECTED: ['Cadastro não aprovado', motivo || 'A solicitação não foi aprovada.'],
      } as const;
      await (tx as any).notificacaoUsuario.create({ data: {
        usuarioId: solicitacao.usuarioId, solicitacaoId: id, estabelecimentoId,
        tipo: `SOLICITACAO_${decisao}`, titulo: mensagens[decisao][0], mensagem: mensagens[decisao][1],
        prioridade: decisao === 'APPROVED' ? 'ALTA' : 'NORMAL', acaoUrl: decisao === 'APPROVED' ? '/configuracoes' : '/onboarding',
      } });
      await (tx as any).logAuditoria.create({ data: {
        estabelecimentoId, usuarioId: revisorId, acao: `REVIEW_ESTABLISHMENT_APPLICATION_${decisao}`,
        entidade: 'SolicitacaoEstabelecimento', entidadeId: String(id), detalhes: { motivo, estabelecimentoId },
      } });
      return (tx as any).solicitacaoEstabelecimento.findUnique({ where: { id }, include: incluirSolicitacao });
    });
  }

  async salvar(id: number, usuarioId: number, dados: SalvarSolicitacaoEstabelecimentoDto) {
    return this.prisma.$transaction(async (tx) => {
      const atual = await (tx as any).solicitacaoEstabelecimento.findFirst({ where: { id, usuarioId } });
      if (!atual) throw new NotFoundException('Solicitação não encontrada');
      if (!STATUS_SOLICITACAO_EDITAVEIS.includes(atual.status)) throw new ConflictException('Solicitação não pode ser alterada neste estado');
      if (atual.versao !== dados.versao) throw new ConflictException('Solicitação foi atualizada em outro dispositivo');

      const atualizada = await (tx as any).solicitacaoEstabelecimento.updateMany({
        where: { id, usuarioId, versao: dados.versao, status: { in: STATUS_SOLICITACAO_EDITAVEIS } },
        data: {
          ...this.camposEditaveis(dados),
          status: 'RASCUNHO', motivoRevisao: null, revisadoEm: null, revisorId: null,
          versao: { increment: 1 },
        },
      });
      if (atualizada.count !== 1) throw new ConflictException('Solicitação foi atualizada em outro dispositivo');
      if (dados.segmentoIds !== undefined) {
        await (tx as any).solicitacaoEstabelecimentoSegmento.deleteMany({ where: { solicitacaoId: id } });
        if (dados.segmentoIds.length) await (tx as any).solicitacaoEstabelecimentoSegmento.createMany({
          data: dados.segmentoIds.map((segmentoId, indice) => ({ solicitacaoId: id, segmentoId, principal: indice === 0 })),
        });
      }
      if (dados.especialidadeIds !== undefined) {
        await (tx as any).solicitacaoEstabelecimentoEspecialidade.deleteMany({ where: { solicitacaoId: id } });
        if (dados.especialidadeIds.length) await (tx as any).solicitacaoEstabelecimentoEspecialidade.createMany({
          data: dados.especialidadeIds.map((especialidadeId) => ({ solicitacaoId: id, especialidadeId })),
        });
      }
      return (tx as any).solicitacaoEstabelecimento.findUnique({
        where: { id }, include: incluirSolicitacao,
      });
    });
  }

  async enviar(id: number, usuarioId: number, versao: number, termosVersao: string) {
    return this.prisma.$transaction(async (tx) => {
      const resultado = await (tx as any).solicitacaoEstabelecimento.updateMany({
        where: { id, usuarioId, versao, status: { in: STATUS_SOLICITACAO_EDITAVEIS } },
        data: {
          status: 'PENDING_REVIEW', termosVersao, termosAceitosEm: new Date(), enviadoEm: new Date(),
          motivoRevisao: null, revisorId: null, revisadoEm: null, versao: { increment: 1 },
        },
      });
      if (resultado.count !== 1) throw new ConflictException('Solicitação mudou antes do envio; atualize os dados e tente novamente');

      const administradores = await (tx as any).usuario.findMany({ where: { papel: 'SUPER_ADMIN' }, select: { id: true } });
      const notificacoes = administradores.map((admin: any) => ({
        usuarioId: admin.id, solicitacaoId: id, tipo: 'NOVA_SOLICITACAO_ESTABELECIMENTO',
        titulo: 'Novo estabelecimento aguardando análise', mensagem: 'Uma nova solicitação de estabelecimento foi enviada para revisão.',
        prioridade: 'ALTA', acaoUrl: `/admin/solicitacoes/${id}`,
      }));
      notificacoes.push({
        usuarioId, solicitacaoId: id, tipo: 'SOLICITACAO_ENVIADA', titulo: 'Cadastro enviado para análise',
        mensagem: 'Recebemos o cadastro do seu estabelecimento. Você será avisado quando a análise for concluída.',
        prioridade: 'NORMAL', acaoUrl: `/solicitacoes-estabelecimento/${id}`,
      });
      await (tx as any).notificacaoUsuario.createMany({ data: notificacoes });
      return (tx as any).solicitacaoEstabelecimento.findUnique({ where: { id }, include: incluirSolicitacao });
    });
  }

  async validarCatalogo(segmentoIds: number[], especialidadeIds: number[]) {
    const [segmentos, especialidades] = await Promise.all([
      (this.prisma as any).segmento.count({ where: { id: { in: segmentoIds }, ativo: true } }),
      (this.prisma as any).especialidade.count({
        where: { id: { in: especialidadeIds }, segmentoId: { in: segmentoIds }, ativo: true },
      }),
    ]);
    return segmentos === segmentoIds.length && especialidades === especialidadeIds.length;
  }

  planoExiste(slug: string) {
    return (this.prisma as any).planoAssinatura.count({ where: { slug, ativo: true } }).then((total: number) => total === 1);
  }

  buscarPapelUsuario(usuarioId: number) {
    return this.prisma.usuario.findUnique({ where: { id: usuarioId }, select: { papel: true } });
  }

  private camposEditaveis(dados: SalvarSolicitacaoEstabelecimentoDto) {
    const campos = ['nomePublico', 'emailComercial', 'telefoneComercial', 'tipoEstabelecimento', 'modeloAtendimento',
      'planoSlug', 'cep', 'logradouro', 'numero', 'complemento', 'pontoReferencia', 'bairro', 'cidade', 'estado'] as const;
    return Object.fromEntries(campos.filter((campo) => dados[campo] !== undefined).map((campo) => [campo, dados[campo]]));
  }

  private async materializar(tx: any, solicitacao: any, revisorId: number) {
    if (solicitacao.estabelecimentoGeradoId) return solicitacao.estabelecimentoGeradoId;
    const solicitante = await tx.usuario.findUnique({
      where: { id: solicitacao.usuarioId },
      select: { estabelecimentoId: true, membroEstabelecimento: true, papel: true },
    });
    if (!solicitante) throw new NotFoundException('Solicitante não encontrado');
    if (solicitante.estabelecimentoId || solicitante.membroEstabelecimento || ['ESTABLISHMENT_OWNER', 'ESTABLISHMENT_MEMBER'].includes(solicitante.papel)) {
      throw new ConflictException('Solicitante já está vinculado a outro estabelecimento');
    }
    const plano = await tx.planoAssinatura.findUnique({ where: { slug: solicitacao.planoSlug } });
    if (!plano) throw new ConflictException('Plano da solicitação não está mais disponível');
    const base = this.slug(solicitacao.nomePublico);
    const existente = await tx.estabelecimento.findUnique({ where: { slug: base }, select: { id: true } });
    const slug = existente ? `${base}-${solicitacao.id}` : base;
    const agora = new Date(); const trialEndsAt = new Date(agora); trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    const endereco = [solicitacao.logradouro, solicitacao.numero, solicitacao.complemento].filter(Boolean).join(', ');
    const estabelecimento = await tx.estabelecimento.create({ data: {
      nome: solicitacao.nomePublico, nomePublico: solicitacao.nomePublico, slug,
      email: solicitacao.emailComercial, telefone: solicitacao.telefoneComercial,
      tipoEstabelecimento: solicitacao.tipoEstabelecimento, modeloAtendimento: solicitacao.modeloAtendimento,
      endereco: endereco || null, bairro: solicitacao.bairro, cidade: solicitacao.cidade, estado: solicitacao.estado,
      status: 'TRIAL', reviewStatus: 'APPROVED', approvedAt: agora, approvedById: revisorId, trialEndsAt,
      unidades: { create: { nome: 'Matriz', endereco: endereco || null, telefone: solicitacao.telefoneComercial } },
      assinatura: { create: { planoId: plano.id, status: 'TRIAL', trialEndsAt } },
      segmentos: { create: solicitacao.segmentos.map((item: any) => ({ segmentoId: item.segmentoId, principal: item.principal })) },
      especialidades: { create: solicitacao.especialidades.map((item: any) => ({ especialidadeId: item.especialidadeId })) },
      configuracoesComissao: { create: { chave: 'PADRAO', percentual: 40 } },
      formasPagamento: { create: [
        { nome: 'Dinheiro', tipo: 'DINHEIRO' }, { nome: 'PIX', tipo: 'PIX' },
        { nome: 'Cartão de crédito', tipo: 'CREDITO', prazoRecebimento: 30 },
        { nome: 'Cartão de débito', tipo: 'DEBITO', prazoRecebimento: 1 },
      ] },
    } });
    await tx.usuario.update({ where: { id: solicitacao.usuarioId }, data: {
      estabelecimentoId: estabelecimento.id, membroEstabelecimento: true, papel: 'ESTABLISHMENT_OWNER',
    } });
    return estabelecimento.id;
  }

  private slug(valor: string) {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'estabelecimento';
  }
}
