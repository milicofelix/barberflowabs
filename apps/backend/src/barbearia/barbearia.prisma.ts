import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import {
  MODELO_ATENDIMENTO_PADRAO,
  TIPO_ESTABELECIMENTO_PADRAO,
} from 'src/estabelecimento/estabelecimento.constants';
import { AtualizarPerfilPublicoBarbeariaDto, CriarBarbeariaDto } from './barbearia.dto';

@Injectable()
export class BarbeariaPrisma {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.barbearia.findMany({
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
    return this.prisma.barbearia.findUnique({
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

  async buscarPerfilPublico(barbeariaId: number) {
    const barbearia = await this.prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      select: this.camposPerfilPublico(),
    });

    if (!barbearia) {
      throw new BadRequestException('Barbearia não encontrada');
    }

    return this.normalizarPerfilPublico(barbearia);
  }

  async atualizarPerfilPublico(
    barbeariaId: number,
    usuarioId: number,
    dados: AtualizarPerfilPublicoBarbeariaDto,
  ) {
    const atual = await this.prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      select: this.camposPerfilPublico(),
    });

    if (!atual) {
      throw new BadRequestException('Barbearia não encontrada');
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
    const atualizado = await this.prisma.barbearia.update({
      where: { id: barbeariaId },
      data: {
        ...dadosPublicos,
        ...(exigeRevisao
          ? {
              reviewStatus: 'PENDING_REVIEW',
              approvedAt: null,
              approvedById: null,
              rejectedAt: null,
              rejectedById: null,
              reviewReason: this.textoOuNulo(dados.observacaoRevisao) ?? 'Perfil público alterado pela barbearia.',
            }
          : {}),
      } as any,
      select: this.camposPerfilPublico(),
    });

    if (exigeRevisao) {
      await this.prisma.logAuditoria.create({
        data: {
          barbeariaId,
          usuarioId,
          acao: 'BARBERSHOP_PUBLIC_PROFILE_REVIEW_REQUESTED',
          entidade: 'Barbearia',
          entidadeId: barbeariaId,
          detalhes: {
            observacao: dados.observacaoRevisao ?? null,
          },
        } as any,
      });
    }

    return this.normalizarPerfilPublico(atualizado);
  }

  async criar(dados: CriarBarbeariaDto) {
    const nome = dados.nome?.trim();
    const slug = this.normalizarSlug(dados.slug);

    if (!nome || !slug) {
      throw new BadRequestException('Nome e slug são obrigatórios');
    }

    const existente = await this.prisma.barbearia.findUnique({ where: { slug } });
    if (existente) {
      throw new ConflictException('Já existe uma barbearia com esse slug');
    }

    return this.prisma.barbearia.create({
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
            segmento: { connect: { slug: 'barbearia' } },
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

  private normalizarPerfilPublico(barbearia: any) {
    return {
      ...barbearia,
      latitude: barbearia.latitude ?? null,
      longitude: barbearia.longitude ?? null,
      prontoParaMapa: Boolean(barbearia.latitude !== null && barbearia.longitude !== null),
      aparecePublicamente: barbearia.reviewStatus === 'APPROVED',
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
