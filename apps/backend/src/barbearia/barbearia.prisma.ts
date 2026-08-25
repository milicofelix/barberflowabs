import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { CriarBarbeariaDto } from './barbearia.dto';

@Injectable()
export class BarbeariaPrisma {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.barbearia.findMany({
      orderBy: { nome: 'asc' },
      include: { unidades: true },
    });
  }

  buscarPorSlug(slug: string) {
    return this.prisma.barbearia.findUnique({
      where: { slug },
      include: { unidades: true },
    });
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
        unidades: {
          create: {
            nome: 'Matriz',
            telefone: dados.telefone?.trim() || null,
          },
        },
      },
      include: { unidades: true },
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
}
