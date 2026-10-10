import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import {
  DEFAULT_ESTABELECIMENTO_ID,
  DEFAULT_ESTABELECIMENTO_SLUG,
  TENANT_ID_HEADER,
  TENANT_SLUG_HEADER,
} from './tenant';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async resolverEstabelecimentoId(req: any): Promise<number> {
    const headers = req?.headers ?? {};
    const idHeader = this.lerHeader(headers, TENANT_ID_HEADER);
    const slugHeader = this.lerHeader(headers, TENANT_SLUG_HEADER) ?? DEFAULT_ESTABELECIMENTO_SLUG;

    if (idHeader) {
      const id = Number(idHeader);
      if (!Number.isInteger(id) || id <= 0) {
        throw new BadRequestException('Header x-estabelecimento-id inválido');
      }

      const estabelecimento = await this.prisma.estabelecimento.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!estabelecimento) {
        throw new NotFoundException('Estabelecimento não encontrado');
      }
      return estabelecimento.id;
    }

    const estabelecimento = await this.prisma.estabelecimento.findUnique({
      where: { slug: slugHeader },
      select: { id: true },
    });

    if (estabelecimento) {
      return estabelecimento.id;
    }

    return DEFAULT_ESTABELECIMENTO_ID;
  }

  private lerHeader(headers: Record<string, string | string[] | undefined>, nome: string) {
    const valor = headers[nome];
    return Array.isArray(valor) ? valor[0] : valor;
  }
}
