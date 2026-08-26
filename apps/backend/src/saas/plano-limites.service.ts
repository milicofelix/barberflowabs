import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

const STATUS_BLOQUEADOS = ['SUSPENDED', 'CANCELED'];

@Injectable()
export class PlanoLimitesService {
  constructor(private readonly prisma: PrismaService) {}

  async validarBarbeariaOperacional(barbeariaId: number) {
    const barbearia = await this.prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      select: { status: true },
    });

    if (barbearia && STATUS_BLOQUEADOS.includes(barbearia.status)) {
      throw new ForbiddenException('Barbearia bloqueada por status da assinatura');
    }
  }

  async validarNovoServico(barbeariaId: number) {
    const uso = await this.obterUso(barbeariaId);
    if (!uso?.limites?.servicos) return;

    if (uso.uso.servicos >= uso.limites.servicos) {
      throw new ForbiddenException('Limite de serviços do plano atingido');
    }
  }

  async validarNovoProfissional(barbeariaId: number) {
    const uso = await this.obterUso(barbeariaId);
    if (!uso?.limites?.profissionais) return;

    if (uso.uso.profissionais >= uso.limites.profissionais) {
      throw new ForbiddenException('Limite de profissionais do plano atingido');
    }
  }

  async obterUso(barbeariaId: number) {
    const barbearia = await this.prisma.barbearia.findUnique({
      where: { id: barbeariaId },
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { profissionais: true, unidades: true, servicos: true } },
      },
    });

    if (!barbearia) return null;

    const plano = barbearia.assinatura?.plano;
    const uso = {
      profissionais: barbearia._count.profissionais,
      unidades: barbearia._count.unidades,
      servicos: barbearia._count.servicos,
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
