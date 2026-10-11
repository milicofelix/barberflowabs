import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { STATUS_SOLICITACAO_EDITAVEIS } from './solicitacao-estabelecimento.constants';
import { SalvarSolicitacaoEstabelecimentoDto } from './solicitacao-estabelecimento.dto';

const incluirSolicitacao = {
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
    const existente = await (this.prisma as any).solicitacaoEstabelecimento.findFirst({
      where: { usuarioId, status: { in: [...STATUS_SOLICITACAO_EDITAVEIS, 'PENDING_REVIEW'] } },
      include: incluirSolicitacao,
      orderBy: { updatedAt: 'desc' },
    });
    if (existente) return existente;
    return (this.prisma as any).solicitacaoEstabelecimento.create({
      data: { usuarioId }, include: incluirSolicitacao,
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

  private camposEditaveis(dados: SalvarSolicitacaoEstabelecimentoDto) {
    const campos = ['nomePublico', 'emailComercial', 'telefoneComercial', 'tipoEstabelecimento', 'modeloAtendimento',
      'planoSlug', 'cep', 'logradouro', 'numero', 'complemento', 'pontoReferencia', 'bairro', 'cidade', 'estado'] as const;
    return Object.fromEntries(campos.filter((campo) => dados[campo] !== undefined).map((campo) => [campo, dados[campo]]));
  }
}
