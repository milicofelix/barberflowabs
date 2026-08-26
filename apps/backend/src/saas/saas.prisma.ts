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
    });
  }

  async onboarding(dados: any) {
    const slug = this.normalizarSlug(dados.barbearia.slug);
    const planoSlug = dados.planoSlug || 'starter';
    const [barbeariaExistente, usuarioExistente, plano] = await Promise.all([
      this.prisma.barbearia.findUnique({ where: { slug } }),
      this.prisma.usuario.findUnique({ where: { email: dados.dono.email } }),
      this.prisma.planoAssinatura.findUnique({ where: { slug: planoSlug } }),
    ]);

    if (barbeariaExistente) throw new ConflictException('Slug já está em uso');
    if (usuarioExistente) throw new ConflictException('E-mail do responsável já está em uso');
    if (!plano) throw new BadRequestException('Plano inválido');

    const trialEndsAt = this.adicionarDias(new Date(), TRIAL_DIAS);

    return this.prisma.$transaction(async (tx) => {
      const barbearia = await tx.barbearia.create({
        data: {
          nome: dados.barbearia.nome.trim(),
          slug,
          email: dados.barbearia.email?.trim() || null,
          telefone: dados.barbearia.telefone?.trim() || null,
          status: 'TRIAL',
          reviewStatus: 'PENDING_REVIEW',
          reviewReason: 'Cadastro realizado pelo onboarding público.',
          trialEndsAt,
          unidades: {
            create: {
              nome: 'Matriz',
              telefone: dados.barbearia.telefone?.trim() || null,
            },
          },
          assinatura: {
            create: {
              planoId: plano.id,
              status: 'TRIAL',
              trialEndsAt,
            },
          },
        } as any,
        include: { assinatura: { include: { plano: true } }, unidades: true },
      });

      const dono = await tx.usuario.create({
        data: {
          barbeariaId: barbearia.id,
          nome: dados.dono.nome.trim(),
          email: dados.dono.email.trim(),
          telefone: dados.dono.telefone?.trim() || null,
          senha: dados.dono.senha,
          barbeiro: true,
          papel: 'BARBER',
        },
        select: { id: true, nome: true, email: true, telefone: true, barbeiro: true, papel: true },
      });

      await tx.logAuditoria.create({
        data: {
          barbeariaId: barbearia.id,
          usuarioId: dono.id,
          acao: 'SAAS_ONBOARDING',
          entidade: 'Barbearia',
          entidadeId: String(barbearia.id),
          detalhes: { planoSlug, reviewStatus: 'PENDING_REVIEW' },
        },
      });

      return { barbearia, dono };
    });
  }

  async billing(barbeariaId: number) {
    const barbearia = await this.prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true } },
      },
    });

    if (!barbearia) return null;
    return this.normalizarBarbearia(barbearia);
  }

  async atualizarPlano(barbeariaId: number, planoSlug: string, usuarioId: number) {
    const plano = await this.prisma.planoAssinatura.findUnique({ where: { slug: planoSlug } });
    if (!plano) throw new BadRequestException('Plano inválido');

    const assinatura = await this.prisma.assinaturaBarbearia.upsert({
      where: { barbeariaId },
      update: {
        planoId: plano.id,
        status: 'ACTIVE',
        currentPeriodEnd: this.adicionarDias(new Date(), 30),
      },
      create: {
        barbeariaId,
        planoId: plano.id,
        status: 'ACTIVE',
        currentPeriodEnd: this.adicionarDias(new Date(), 30),
      },
      include: { plano: true },
    });

    await this.prisma.barbearia.update({
      where: { id: barbeariaId },
      data: { status: 'ACTIVE' },
    });

    await this.registrarAuditoria(barbeariaId, usuarioId, 'BILLING_CHANGE_PLAN', 'AssinaturaBarbearia', assinatura.id, { planoSlug });
    return assinatura;
  }

  async listarBarbeariasAdmin() {
    const barbearias = await this.prisma.barbearia.findMany({
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true, agendamentos: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return barbearias.map((barbearia) => this.normalizarBarbearia(barbearia));
  }

  async listarBarbeariasPendentesAdmin() {
    const barbearias = await this.prisma.barbearia.findMany({
      where: { reviewStatus: 'PENDING_REVIEW' } as any,
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true, agendamentos: true } },
      },
      orderBy: { createdAt: 'asc' },
    } as any);

    return barbearias.map((barbearia) => this.normalizarBarbearia(barbearia));
  }

  async atualizarStatusBarbearia(id: number, status: string, usuarioId: number) {
    const barbearia = await this.prisma.barbearia.update({
      where: { id },
      data: {
        status,
        assinatura: {
          update: { status },
        },
      },
      include: { assinatura: { include: { plano: true } } },
    });

    await this.registrarAuditoria(id, usuarioId, 'ADMIN_CHANGE_BARBERSHOP_STATUS', 'Barbearia', id, { status });
    return barbearia;
  }

  async atualizarDestaqueBarbearia(id: number, destaque: boolean, usuarioId: number) {
    const barbearia = await this.prisma.barbearia.update({
      where: { id },
      data: { destaque },
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { usuarios: true, profissionais: true, unidades: true, servicos: true, agendamentos: true } },
      },
    });

    await this.registrarAuditoria(id, usuarioId, 'ADMIN_CHANGE_BARBERSHOP_HIGHLIGHT', 'Barbearia', id, { destaque });
    return this.normalizarBarbearia(barbearia);
  }


  async aprovarBarbearia(id: number, usuarioId: number, motivo?: string) {
    const barbearia = await this.prisma.barbearia.update({
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

    await this.registrarAuditoria(id, usuarioId, 'ADMIN_APPROVE_BARBERSHOP', 'Barbearia', id, {
      motivo: motivo?.trim() || null,
    });
    return this.normalizarBarbearia(barbearia);
  }

  async reprovarBarbearia(id: number, usuarioId: number, motivo: string) {
    const barbearia = await this.prisma.barbearia.update({
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

    await this.registrarAuditoria(id, usuarioId, 'ADMIN_REJECT_BARBERSHOP', 'Barbearia', id, {
      motivo: motivo.trim(),
    });
    return this.normalizarBarbearia(barbearia);
  }

  listarAuditoriaAdmin() {
    return this.prisma.logAuditoria.findMany({
      include: {
        barbearia: { select: { id: true, nome: true, slug: true } },
        usuario: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private async registrarAuditoria(
    barbeariaId: number,
    usuarioId: number,
    acao: string,
    entidade: string,
    entidadeId: number,
    detalhes: any,
  ) {
    await this.prisma.logAuditoria.create({
      data: {
        barbeariaId,
        usuarioId,
        acao,
        entidade,
        entidadeId: String(entidadeId),
        detalhes,
      },
    });
  }

  private normalizarBarbearia(barbearia: any) {
    const plano = barbearia.assinatura?.plano;
    const uso = {
      profissionais: barbearia._count?.profissionais ?? 0,
      unidades: barbearia._count?.unidades ?? 0,
      servicos: barbearia._count?.servicos ?? 0,
    };
    const limites = plano
      ? {
          profissionais: plano.limiteUsuarios,
          unidades: plano.limiteUnidades,
          servicos: plano.limiteServicos,
        }
      : null;

    return {
      ...barbearia,
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
      assinatura: barbearia.assinatura
        ? {
            ...barbearia.assinatura,
            plano: {
              ...barbearia.assinatura.plano,
              precoMensal: Number(barbearia.assinatura.plano.precoMensal),
            },
          }
        : null,
    };
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
