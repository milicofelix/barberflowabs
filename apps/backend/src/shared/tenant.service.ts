import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import {
  DEFAULT_BARBEARIA_ID,
  DEFAULT_BARBEARIA_SLUG,
  TENANT_ID_HEADER,
  TENANT_SLUG_HEADER,
} from './tenant';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async resolverBarbeariaId(req: any): Promise<number> {
    const headers = req?.headers ?? {};
    const idHeader = this.lerHeader(headers, TENANT_ID_HEADER);
    const slugHeader = this.lerHeader(headers, TENANT_SLUG_HEADER) ?? DEFAULT_BARBEARIA_SLUG;

    if (idHeader) {
      const id = Number(idHeader);
      if (!Number.isInteger(id) || id <= 0) {
        throw new BadRequestException('Header x-barbearia-id inválido');
      }

      const barbearia = await this.prisma.barbearia.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!barbearia) {
        throw new NotFoundException('Barbearia não encontrada');
      }
      return barbearia.id;
    }

    const barbearia = await this.prisma.barbearia.findUnique({
      where: { slug: slugHeader },
      select: { id: true },
    });

    if (barbearia) {
      return barbearia.id;
    }

    return DEFAULT_BARBEARIA_ID;
  }

  private lerHeader(headers: Record<string, string | string[] | undefined>, nome: string) {
    const valor = headers[nome];
    return Array.isArray(valor) ? valor[0] : valor;
  }
}
