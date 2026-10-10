import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

const TRIAL_DIAS = 14;

@Injectable()
export class SaasPrisma {
  constructor(private readonly prisma: PrismaService) {}

  listarPlanos() {
    return this.prisma.planoAssinatura.findMany({
      where: { ativo: true },
      orderBy: { precoMensal: 'asc' },
    }).then((planos) => planos.map((plano) => this.normalizarPlano(plano)));
  }

  listarPlanosAdmin() {
    return this.prisma.planoAssinatura.findMany({
      orderBy: { precoMensal: 'asc' },
    }).then((planos) => planos.map((plano) => this.normalizarPlano(plano)));
  }

  async atualizarPlanoAdmin(id: number, usuarioId: number, dados: any) {
    const plano = await this.prisma.planoAssinatura.update({
      where: { id },
      data: {
        ...(dados.nome !== undefined ? { nome: dados.nome.trim() } : {}),
        ...(dados.descricao !== undefined ? { descricao: dados.descricao.trim() } : {}),
        ...(dados.precoMensal !== undefined ? { precoMensal: Number(dados.precoMensal) } : {}),
        ...(dados.limiteUsuarios !== undefined ? { limiteUsuarios: Number(dados.limiteUsuarios) } : {}),
        ...(dados.limiteUnidades !== undefined ? { limiteUnidades: Number(dados.limiteUnidades) } : {}),
        ...(dados.limiteServicos !== undefined ? { limiteServicos: Number(dados.limiteServicos) } : {}),
        ...(dados.ativo !== undefined ? { ativo: dados.ativo } : {}),
      },
    });

    await this.registrarAuditoria(null, usuarioId, 'ADMIN_UPDATE_SUBSCRIPTION_PLAN', 'PlanoAssinatura', id, {
      nome: plano.nome,
      slug: plano.slug,
    });
    return this.normalizarPlano(plano);
  }

  async onboarding(dados: any) {
    const slug = this.normalizarSlug(dados.estabelecimento.slug);
    const planoSlug = dados.planoSlug || 'mensal';
    const [estabelecimentoExistente, usuarioExistente, plano, segmentos, especialidades] = await Promise.all([
      this.prisma.estabelecimento.findUnique({ where: { slug } }),
      this.prisma.usuario.findUnique({ where: { email: dados.dono.email } }),
      this.prisma.planoAssinatura.findUnique({ where: { slug: planoSlug } }),
      (this.prisma as any).segmento.count({ where: { id: { in: dados.estabelecimento.segmentoIds }, ativo: true } }),
      (this.prisma as any).especialidade.count({
        where: {
          id: { in: dados.estabelecimento.especialidadeIds },
          segmentoId: { in: dados.estabelecimento.segmentoIds },
          ativo: true,
        },
      }),
    ]);

    if (estabelecimentoExistente) throw new ConflictException('Slug já está em uso');
    if (usuarioExistente) throw new ConflictException('E-mail do responsável já está em uso');
    if (!plano) throw new BadRequestException('Plano inválido');
    if (segmentos !== dados.estabelecimento.segmentoIds.length || especialidades !== dados.estabelecimento.especialidadeIds.length) {
      throw new BadRequestException('Segmentos ou especialidades incompatíveis');
    }

    const trialEndsAt = this.adicionarDias(new Date(), TRIAL_DIAS);

    return this.prisma.$transaction(async (tx) => {
      const estabelecimento = await tx.estabelecimento.create({
        data: {
          nome: dados.estabelecimento.nome.trim(),
          slug,
          email: dados.estabelecimento.email?.trim() || null,
          telefone: dados.estabelecimento.telefone?.trim() || null,
          tipoEstabelecimento: dados.estabelecimento.tipoEstabelecimento,
          modeloAtendimento: dados.estabelecimento.modeloAtendimento,
          status: 'TRIAL',
          reviewStatus: 'PENDING_REVIEW',
          reviewReason: 'Cadastro realizado pelo onboarding público.',
          trialEndsAt,
          unidades: {
            create: {
              nome: 'Matriz',
              telefone: dados.estabelecimento.telefone?.trim() || null,
            },
          },
          assinatura: {
            create: {
              planoId: plano.id,
              status: 'TRIAL',
              trialEndsAt,
            },
          },
          segmentos: {
            create: dados.estabelecimento.segmentoIds.map((segmentoId: number, indice: number) => ({
              segmentoId,
              principal: indice === 0,
            })),
          },
          especialidades: {
            create: dados.estabelecimento.especialidadeIds.map((especialidadeId: number) => ({ especialidadeId })),
          },
        } as any,
        include: { assinatura: { include: { plano: true } }, unidades: true },
      });

      const dono = await tx.usuario.create({
        data: {
          estabelecimentoId: estabelecimento.id,
          nome: dados.dono.nome.trim(),
          email: dados.dono.email.trim(),
          telefone: dados.dono.telefone?.trim() || null,
          senha: dados.dono.senha,
          membroEstabelecimento: true,
          papel: 'ESTABLISHMENT_OWNER',
        },
        select: { id: true, nome: true, email: true, telefone: true, membroEstabelecimento: true, papel: true },
      });

      await tx.logAuditoria.create({
        data: {
          estabelecimentoId: estabelecimento.id,
          usuarioId: dono.id,
          acao: 'SAAS_ONBOARDING',
          entidade: 'Estabelecimento',
          entidadeId: String(estabelecimento.id),
          detalhes: {
            planoSlug,
            reviewStatus: 'PENDING_REVIEW',
            tipoEstabelecimento: dados.estabelecimento.tipoEstabelecimento,
            modeloAtendimento: dados.estabelecimento.modeloAtendimento,
            segmentoIds: dados.estabelecimento.segmentoIds,
            especialidadeIds: dados.estabelecimento.especialidadeIds,
          },
        },
      });

      await tx.logAuditoria.create({
        data: {
          estabelecimentoId: null,
          usuarioId: dono.id,
          acao: 'SAAS_ADMIN_NOTIFICATION',
          entidade: 'Estabelecimento',
          entidadeId: String(estabelecimento.id),
          detalhes: {
            tipo: 'NOVO_CADASTRO_ESTABELECIMENTO',
            titulo: 'Novo estabelecimento aguardando aprovação',
            mensagem: `${estabelecimento.nome} concluiu o cadastro público e precisa de revisão.`,
            estabelecimentoId: estabelecimento.id,
            estabelecimentoSlug: estabelecimento.slug,
            planoSlug,
          },
        },
      });

      return { estabelecimento, dono };
    });
  }

  async billing(estabelecimentoId: number) {
    const estabelecimento = await this.prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true } },
      },
    });

    if (!estabelecimento) return null;
    return this.normalizarEstabelecimento(estabelecimento);
  }

  async atualizarPlano(estabelecimentoId: number, planoSlug: string, usuarioId: number) {
    const plano = await this.prisma.planoAssinatura.findUnique({ where: { slug: planoSlug } });
    if (!plano) throw new BadRequestException('Plano inválido');

    const assinatura = await this.prisma.assinaturaEstabelecimento.upsert({
      where: { estabelecimentoId },
      update: {
        planoId: plano.id,
        status: 'ACTIVE',
        currentPeriodEnd: this.adicionarDias(new Date(), this.diasDoPlano(plano.slug)),
      },
      create: {
        estabelecimentoId,
        planoId: plano.id,
        status: 'ACTIVE',
        currentPeriodEnd: this.adicionarDias(new Date(), this.diasDoPlano(plano.slug)),
      },
      include: { plano: true },
    });

    await this.prisma.estabelecimento.update({
      where: { id: estabelecimentoId },
      data: { status: 'ACTIVE' },
    });

    await this.registrarAuditoria(estabelecimentoId, usuarioId, 'BILLING_CHANGE_PLAN', 'AssinaturaEstabelecimento', assinatura.id, { planoSlug });
    return {
      ...assinatura,
      plano: this.normalizarPlano(assinatura.plano),
    };
  }

  async listarEstabelecimentosAdmin() {
    const estabelecimentos = await this.prisma.estabelecimento.findMany({
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true, agendamentos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return estabelecimentos.map((estabelecimento) => this.normalizarEstabelecimento(estabelecimento));
  }

  async listarEstabelecimentosPendentesAdmin() {
    const estabelecimentos = await this.prisma.estabelecimento.findMany({
      where: { reviewStatus: 'PENDING_REVIEW' } as any,
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true, agendamentos: true } },
      },
      orderBy: { createdAt: 'asc' },
    } as any);

    return estabelecimentos.map((estabelecimento) => this.normalizarEstabelecimento(estabelecimento));
  }

  async atualizarStatusEstabelecimento(id: number, status: string, usuarioId: number) {
    const estabelecimento = await this.prisma.estabelecimento.update({
      where: { id },
      data: {
        status,
        assinatura: {
          update: { status },
        },
      },
      include: { assinatura: { include: { plano: true } } },
    });

    await this.registrarAuditoria(id, usuarioId, 'ADMIN_CHANGE_ESTABLISHMENT_STATUS', 'Estabelecimento', id, { status });
    return estabelecimento;
  }

  async atualizarDestaqueEstabelecimento(id: number, destaque: boolean, usuarioId: number) {
    const estabelecimento = await this.prisma.estabelecimento.update({
      where: { id },
      data: { destaque },
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true, agendamentos: true } },
      },
    });

    await this.registrarAuditoria(id, usuarioId, 'ADMIN_CHANGE_ESTABLISHMENT_HIGHLIGHT', 'Estabelecimento', id, { destaque });
    return this.normalizarEstabelecimento(estabelecimento);
  }

  async atualizarComercialEstabelecimento(id: number, usuarioId: number, dados: any) {
    const estabelecimento = await this.prisma.estabelecimento.update({
      where: { id },
      data: {
        comercialStatus: dados.comercialStatus,
        notasInternas: this.textoOuNulo(dados.notasInternas),
        ultimoContatoEm: dados.ultimoContatoEm,
        proximoContatoEm: dados.proximoContatoEm,
      } as any,
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true, agendamentos: true } },
      },
    } as any);

    await this.registrarAuditoria(id, usuarioId, 'ADMIN_UPDATE_COMMERCIAL_DETAILS', 'Estabelecimento', id, {
      comercialStatus: dados.comercialStatus,
      ultimoContatoEm: dados.ultimoContatoEm,
      proximoContatoEm: dados.proximoContatoEm,
    });
    return this.normalizarEstabelecimento(estabelecimento);
  }


  async aprovarEstabelecimento(id: number, usuarioId: number, motivo?: string) {
    const estabelecimento = await this.prisma.estabelecimento.update({
      where: { id },
      data: {
        reviewStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedById: usuarioId,
        rejectedAt: null,
        rejectedById: null,
        reviewReason: motivo?.trim() || 'Cadastro aprovado pelo admin SaaS.',
      } as any,
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true, agendamentos: true } },
      },
    } as any);

    await this.registrarAuditoria(id, usuarioId, 'ADMIN_APPROVE_ESTABLISHMENT', 'Estabelecimento', id, {
      motivo: motivo?.trim() || null,
    });
    return this.normalizarEstabelecimento(estabelecimento);
  }

  async reprovarEstabelecimento(id: number, usuarioId: number, motivo: string) {
    const estabelecimento = await this.prisma.estabelecimento.update({
      where: { id },
      data: {
        reviewStatus: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: usuarioId,
        reviewReason: motivo.trim(),
      } as any,
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true, agendamentos: true } },
      },
    } as any);

    await this.registrarAuditoria(id, usuarioId, 'ADMIN_REJECT_ESTABLISHMENT', 'Estabelecimento', id, {
      motivo: motivo.trim(),
    });
    return this.normalizarEstabelecimento(estabelecimento);
  }

  listarAuditoriaAdmin() {
    return this.prisma.logAuditoria.findMany({
      include: {
        estabelecimento: { select: { id: true, nome: true, slug: true } },
        usuario: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  listarNotificacoesAdmin() {
    return this.prisma.logAuditoria.findMany({
      where: { acao: 'SAAS_ADMIN_NOTIFICATION' },
      include: {
        estabelecimento: { select: { id: true, nome: true, slug: true, reviewStatus: true, status: true } },
        usuario: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  listarDenunciasPerfilAdmin() {
    return (this.prisma as any).denunciaPerfilPublico.findMany({
      include: {
        estabelecimento: { select: { id: true, nome: true, slug: true, reviewStatus: true, status: true } },
        revisadoPor: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async revisarDenunciaPerfilAdmin(id: number, usuarioId: number, dados: any) {
    const denuncia = await (this.prisma as any).denunciaPerfilPublico.update({
      where: { id },
      data: {
        status: dados.status,
        resolucao: this.textoOuNulo(dados.resolucao),
        revisadoPorId: usuarioId,
        revisadoEm: new Date(),
      },
      include: {
        estabelecimento: { select: { id: true, nome: true, slug: true } },
        revisadoPor: { select: { id: true, nome: true, email: true } },
      },
    });

    await this.registrarAuditoria(null, usuarioId, 'ADMIN_REVIEW_PUBLIC_PROFILE_REPORT', 'DenunciaPerfilPublico', id, {
      status: dados.status,
      estabelecimentoId: denuncia.estabelecimentoId,
      estabelecimentoSlug: denuncia.estabelecimento?.slug,
    });
    return denuncia;
  }

  private async registrarAuditoria(
    estabelecimentoId: number | null,
    usuarioId: number,
    acao: string,
    entidade: string,
    entidadeId: number,
    detalhes: any,
  ) {
    await this.prisma.logAuditoria.create({
      data: {
        estabelecimentoId,
        usuarioId,
        acao,
        entidade,
        entidadeId: String(entidadeId),
        detalhes,
      },
    });
  }

  private normalizarEstabelecimento(estabelecimento: any) {
    const plano = estabelecimento.assinatura?.plano;
    const uso = {
      profissionais: estabelecimento._count?.profissionais ?? 0,
      unidades: estabelecimento._count?.unidades ?? 0,
      servicos: estabelecimento._count?.servicos ?? 0,
    };
    const limites = plano
      ? {
          profissionais: plano.limiteUsuarios,
          unidades: plano.limiteUnidades,
          servicos: plano.limiteServicos,
        }
      : null;

    return {
      ...estabelecimento,
      limites: limites
        ? {
            uso,
            limites,
            percentual: {
              profissionais: this.percentualUso(uso.profissionais, limites.profissionais),
              unidades: this.percentualUso(uso.unidades, limites.unidades),
              servicos: this.percentualUso(uso.servicos, limites.servicos),
            },
            excedido: {
              profissionais: uso.profissionais >= limites.profissionais,
              unidades: uso.unidades >= limites.unidades,
              servicos: uso.servicos >= limites.servicos,
            },
          }
        : null,
      assinatura: estabelecimento.assinatura
        ? {
            ...estabelecimento.assinatura,
            plano: this.normalizarPlano(estabelecimento.assinatura.plano),
          }
        : null,
    };
  }

  private normalizarPlano(plano: any) {
    const recursos = Array.isArray(plano.recursos) ? plano.recursos : [];
    const ciclo = this.cicloDoPlano(plano.slug);

    return {
      ...plano,
      recursos,
      ciclo,
      formaPagamento: 'PIX',
      precoMensal: Number(plano.precoMensal),
      valorDoCiclo: Number(plano.precoMensal),
      economiaPercentual: ciclo.economiaPercentual,
    };
  }

  private cicloDoPlano(slug: string) {
    if (slug === 'trimestral') {
      return {
        tipo: 'TRIMESTRAL',
        meses: 3,
        dias: 90,
        label: 'Trimestral',
        cobranca: 'Pagamento a cada 3 meses via PIX',
        economiaPercentual: 10,
      };
    }

    if (slug === 'anual') {
      return {
        tipo: 'ANUAL',
        meses: 12,
        dias: 365,
        label: 'Anual',
        cobranca: 'Pagamento anual via PIX',
        economiaPercentual: 20,
      };
    }

    return {
      tipo: 'MENSAL',
      meses: 1,
      dias: 30,
      label: 'Mensal',
      cobranca: 'Pagamento mensal via PIX',
      economiaPercentual: 0,
    };
  }

  private diasDoPlano(slug: string) {
    return this.cicloDoPlano(slug).dias;
  }

  private adicionarDias(data: Date, dias: number) {
    const novaData = new Date(data);
    novaData.setDate(novaData.getDate() + dias);
    return novaData;
  }

  private percentualUso(uso: number, limite: number) {
    if (!limite) return 0;
    return Math.min(100, Math.round((uso / limite) * 100));
  }

  private textoOuNulo(valor?: string | null) {
    const texto = typeof valor === 'string' ? valor.trim() : '';
    return texto || null;
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
}
