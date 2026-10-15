import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import {
  MODELO_ATENDIMENTO_PADRAO,
  TIPO_ESTABELECIMENTO_PADRAO,
} from 'src/estabelecimento/estabelecimento.constants';
import { AtualizarPerfilPublicoEstabelecimentoDto, CriarEstabelecimentoDto } from './estabelecimento.dto';

@Injectable()
export class EstabelecimentoPrisma {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.estabelecimento.findMany({
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        slug: true,
        telefone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        unidades: true,
      },
    });
  }

  buscarPorSlug(slug: string) {
    return this.prisma.estabelecimento.findUnique({
      where: { slug },
      select: {
        id: true,
        nome: true,
        slug: true,
        telefone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        unidades: true,
      },
    });
  }

  async buscarPerfilPublico(estabelecimentoId: number) {
    const estabelecimento = await this.prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      select: this.camposPerfilPublico(),
    });

    if (!estabelecimento) {
      throw new BadRequestException('Estabelecimento não encontrado');
    }

    return this.normalizarPerfilPublico(estabelecimento);
  }

  async buscarProntidaoPublicacao(estabelecimentoId: number) {
    const estabelecimento = await this.prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      select: {
        reviewStatus: true,
        status: true,
        modeloAtendimento: true,
        endereco: true,
        bairro: true,
        cidade: true,
        estado: true,
        latitude: true,
        longitude: true,
        aceitaAgendamentoOnline: true,
        _count: {
          select: {
            servicos: true,
            profissionais: true,
            horariosFuncionamento: { where: { ativo: true } },
            profissionaisServicos: { where: { ativo: true } },
          },
        },
      },
    });

    if (!estabelecimento) throw new BadRequestException('Estabelecimento não encontrado');

    const exigeEndereco = estabelecimento.modeloAtendimento !== 'DOMICILIAR';
    const enderecoCompleto = !exigeEndereco || Boolean(
      estabelecimento.endereco && estabelecimento.bairro && estabelecimento.cidade && estabelecimento.estado,
    );
    const coordenadasValidas = Boolean(estabelecimento.latitude !== null && estabelecimento.longitude !== null);
    const statusOperacional = !['SUSPENDED', 'CANCELED', 'PAST_DUE'].includes(estabelecimento.status);
    const itens = [
      this.itemProntidao('APROVACAO', 'Aprovação administrativa', estabelecimento.reviewStatus === 'APPROVED', 'Aguarde a aprovação ou consulte o motivo da revisão.', 'PERFIL'),
      this.itemProntidao('STATUS', 'Assinatura operacional', statusOperacional, 'Regularize a assinatura para liberar a publicação.', 'FINANCEIRO'),
      this.itemProntidao('ENDERECO', 'Endereço completo', enderecoCompleto, 'Complete o endereço público do estabelecimento.', 'PERFIL'),
      this.itemProntidao('COORDENADAS', 'Localização validada', coordenadasValidas, 'Solicite ao superadmin a validação da localização.', 'PERFIL'),
      this.itemProntidao('SERVICO', 'Serviço cadastrado', estabelecimento._count.servicos > 0, 'Cadastre pelo menos um serviço.', 'SERVICOS'),
      this.itemProntidao('PROFISSIONAL', 'Profissional cadastrado', estabelecimento._count.profissionais > 0, 'Cadastre ou vincule pelo menos um profissional.', 'EQUIPE'),
      this.itemProntidao('VINCULO', 'Profissional habilitado em serviço', estabelecimento._count.profissionaisServicos > 0, 'Vincule um profissional a um serviço.', 'SERVICOS'),
      this.itemProntidao('HORARIO', 'Horário geral de funcionamento', estabelecimento._count.horariosFuncionamento > 0, 'Configure ao menos um dia de funcionamento.', 'AGENDA'),
    ];
    const codigosLista = ['APROVACAO', 'STATUS', 'ENDERECO', 'SERVICO', 'PROFISSIONAL', 'VINCULO', 'HORARIO'];
    const prontoParaLista = itens.filter((item) => codigosLista.includes(item.codigo)).every((item) => item.concluido);

    return {
      prontoParaLista,
      prontoParaMapa: prontoParaLista && coordenadasValidas,
      aceitaAgendamentoOnline: estabelecimento.aceitaAgendamentoOnline,
      progresso: Math.round((itens.filter((item) => item.concluido).length / itens.length) * 100),
      itens,
    };
  }

  async atualizarPerfilPublico(
    estabelecimentoId: number,
    usuarioId: number,
    dados: AtualizarPerfilPublicoEstabelecimentoDto,
  ) {
    const atual = await this.prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      select: this.camposPerfilPublico(),
    });

    if (!atual) {
      throw new BadRequestException('Estabelecimento não encontrado');
    }

    const dadosPublicos: any = {
      nomePublico: this.textoOuNulo(dados.nomePublico),
      descricaoPublica: this.textoOuNulo(dados.descricaoPublica),
      imagemCapaURL: this.textoOuNulo(dados.imagemCapaURL),
      telefone: this.textoOuNulo(dados.telefone),
      email: this.textoOuNulo(dados.email),
      endereco: this.textoOuNulo(dados.endereco),
      bairro: this.textoOuNulo(dados.bairro),
      cidade: this.textoOuNulo(dados.cidade),
      estado: this.textoOuNulo(dados.estado)?.toUpperCase() ?? null,
      latitude: atual.latitude,
      longitude: atual.longitude,
      aceitaAgendamentoOnline: Boolean(dados.aceitaAgendamentoOnline),
    };

    const exigeRevisao = this.alterouCamposCriticos(atual, dadosPublicos);
    const atualizado = await this.prisma.estabelecimento.update({
      where: { id: estabelecimentoId },
      data: {
        ...dadosPublicos,
        ...(exigeRevisao
          ? {
              reviewStatus: 'PENDING_REVIEW',
              approvedAt: null,
              approvedById: null,
              rejectedAt: null,
              rejectedById: null,
              reviewReason: this.textoOuNulo(dados.observacaoRevisao) ?? 'Perfil público alterado pelo estabelecimento.',
            }
          : {}),
      } as any,
      select: this.camposPerfilPublico(),
    });

    if (exigeRevisao) {
      const administradores = await this.prisma.usuario.findMany({
        where: { papel: 'SUPER_ADMIN' },
        select: { id: true },
      });
      await this.prisma.$transaction([
        this.prisma.logAuditoria.create({
          data: {
            estabelecimentoId,
            usuarioId,
            acao: 'ESTABLISHMENT_PUBLIC_PROFILE_REVIEW_REQUESTED',
            entidade: 'Estabelecimento',
            entidadeId: String(estabelecimentoId),
            detalhes: {
              observacao: dados.observacaoRevisao ?? null,
            },
          } as any,
        }),
        ...(administradores.length
          ? [this.prisma.notificacaoUsuario.createMany({
              data: administradores.map((administrador) => ({
                usuarioId: administrador.id,
                estabelecimentoId,
                tipo: 'PERFIL_ESTABELECIMENTO_REVIEW_REQUESTED',
                titulo: 'Perfil de estabelecimento aguardando revisão',
                mensagem: `${atual.nomePublico || atual.nome} alterou dados cadastrais que exigem nova análise.`,
                prioridade: 'ALTA',
                acaoUrl: '/admin',
              })),
            })]
          : []),
      ]);
    }

    return this.normalizarPerfilPublico(atualizado);
  }

  async criar(dados: CriarEstabelecimentoDto) {
    const nome = dados.nome?.trim();
    const slug = this.normalizarSlug(dados.slug);

    if (!nome || !slug) {
      throw new BadRequestException('Nome e slug são obrigatórios');
    }

    const existente = await this.prisma.estabelecimento.findUnique({ where: { slug } });
    if (existente) {
      throw new ConflictException('Já existe um estabelecimento com esse slug');
    }

    return this.prisma.estabelecimento.create({
      data: {
        nome,
        slug,
        email: dados.email?.trim() || null,
        telefone: dados.telefone?.trim() || null,
        tipoEstabelecimento: TIPO_ESTABELECIMENTO_PADRAO,
        modeloAtendimento: MODELO_ATENDIMENTO_PADRAO,
        unidades: {
          create: {
            nome: 'Matriz',
            telefone: dados.telefone?.trim() || null,
          },
        },
        segmentos: {
          create: {
            principal: true,
            segmento: { connect: { slug: 'estabelecimento' } },
          },
        },
      } as any,
      select: {
        id: true,
        nome: true,
        slug: true,
        telefone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        unidades: true,
      },
    });
  }

  private normalizarSlug(slug: string) {
    return slug
      ?.trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private camposPerfilPublico() {
    return {
      id: true,
      nome: true,
      slug: true,
      nomePublico: true,
      descricaoPublica: true,
      imagemCapaURL: true,
      logoModo: true,
      logoURL: true,
      tipoEstabelecimento: true,
      segmentos: { include: { segmento: { select: { slug: true } } } },
      telefone: true,
      email: true,
      endereco: true,
      bairro: true,
      cidade: true,
      estado: true,
      latitude: true,
      longitude: true,
      aceitaAgendamentoOnline: true,
      reviewStatus: true,
      reviewReason: true,
      approvedAt: true,
      rejectedAt: true,
      updatedAt: true,
    } as any;
  }

  private normalizarPerfilPublico(estabelecimento: any) {
    return {
      ...estabelecimento,
      latitude: estabelecimento.latitude ?? null,
      longitude: estabelecimento.longitude ?? null,
      prontoParaMapa: Boolean(estabelecimento.latitude !== null && estabelecimento.longitude !== null),
      aparecePublicamente: estabelecimento.reviewStatus === 'APPROVED',
    };
  }

  private alterouCamposCriticos(atual: any, novo: any) {
    const campos = [
      'nomePublico',
      'endereco',
      'bairro',
      'cidade',
      'estado',
    ];

    return atual.reviewStatus === 'APPROVED' && campos.some((campo) => String(atual[campo] ?? '') !== String(novo[campo] ?? ''));
  }

  private textoOuNulo(valor: unknown) {
    if (typeof valor !== 'string') return null;
    const texto = valor.trim();
    return texto.length > 0 ? texto : null;
  }

  private itemProntidao(codigo: string, titulo: string, concluido: boolean, orientacao: string, destino: string) {
    return { codigo, titulo, concluido, orientacao: concluido ? null : orientacao, destino };
  }
}
