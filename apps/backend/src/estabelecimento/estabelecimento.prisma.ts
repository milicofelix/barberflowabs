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
      latitude: this.numeroOuNulo(dados.latitude),
      longitude: this.numeroOuNulo(dados.longitude),
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
      await this.prisma.logAuditoria.create({
        data: {
          estabelecimentoId,
          usuarioId,
          acao: 'ESTABLISHMENT_PUBLIC_PROFILE_REVIEW_REQUESTED',
          entidade: 'Estabelecimento',
          entidadeId: estabelecimentoId,
          detalhes: {
            observacao: dados.observacaoRevisao ?? null,
          },
        } as any,
      });
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
      'descricaoPublica',
      'imagemCapaURL',
      'endereco',
      'bairro',
      'cidade',
      'estado',
      'latitude',
      'longitude',
    ];

    return atual.reviewStatus === 'APPROVED' && campos.some((campo) => String(atual[campo] ?? '') !== String(novo[campo] ?? ''));
  }

  private textoOuNulo(valor: unknown) {
    if (typeof valor !== 'string') return null;
    const texto = valor.trim();
    return texto.length > 0 ? texto : null;
  }

  private numeroOuNulo(valor: unknown) {
    if (valor === null || valor === undefined || valor === '') return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
  }
}
