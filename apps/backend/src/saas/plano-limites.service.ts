import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

const STATUS_BLOQUEADOS = ['PAST_DUE', 'SUSPENDED', 'CANCELED'];

@Injectable()
export class PlanoLimitesService {
  constructor(private readonly prisma: PrismaService) {}

  async validarEstabelecimentoOperacional(estabelecimentoId: number) {
    const estabelecimento = await this.prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      select: { status: true },
    });

    if (estabelecimento && STATUS_BLOQUEADOS.includes(estabelecimento.status)) {
      throw new ForbiddenException('Estabelecimento bloqueada por status da assinatura');
    }
  }

  async validarNovoServico(estabelecimentoId: number) {
    return this.validarNovosServicos(estabelecimentoId, 1);
  }

  async validarNovosServicos(estabelecimentoId: number, quantidade: number) {
    const uso = await this.obterUso(estabelecimentoId);
    if (!uso?.limites?.servicos) return;

    if (uso.uso.servicos + quantidade > uso.limites.servicos) {
      throw new ForbiddenException(`O plano permite adicionar somente mais ${Math.max(0, uso.limites.servicos - uso.uso.servicos)} serviço(s)`);
    }
  }

  async validarNovoProfissional(estabelecimentoId: number) {
    const uso = await this.obterUso(estabelecimentoId);
    if (!uso?.limites?.profissionais) return;

    if (uso.uso.profissionais >= uso.limites.profissionais) {
      throw new ForbiddenException('Limite de profissionais do plano atingido');
    }
  }

  async obterUso(estabelecimentoId: number) {
    const estabelecimento = await this.prisma.estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { profissionais: true, unidades: true, servicos: true } },
      },
    });

    if (!estabelecimento) return null;

    const plano = estabelecimento.assinatura?.plano;
    const uso = {
      profissionais: estabelecimento._count.profissionais,
      unidades: estabelecimento._count.unidades,
      servicos: estabelecimento._count.servicos,
    };
    const limites = plano
      ? {
          profissionais: plano.limiteUsuarios,
          unidades: plano.limiteUnidades,
          servicos: plano.limiteServicos,
        }
      : null;

    return {
      uso,
      limites,
      percentual: limites
        ? {
            profissionais: this.percentual(uso.profissionais, limites.profissionais),
            unidades: this.percentual(uso.unidades, limites.unidades),
            servicos: this.percentual(uso.servicos, limites.servicos),
          }
        : null,
      excedido: limites
        ? {
            profissionais: uso.profissionais >= limites.profissionais,
            unidades: uso.unidades >= limites.unidades,
            servicos: uso.servicos >= limites.servicos,
          }
        : null,
    };
  }

  private percentual(uso: number, limite: number) {
    if (!limite) return 0;
    return Math.min(100, Math.round((uso / limite) * 100));
  }
}
