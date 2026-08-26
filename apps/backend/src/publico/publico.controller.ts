import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PublicoPrisma } from './publico.prisma';

@Controller('public')
export class PublicoController {
  constructor(private readonly repo: PublicoPrisma) {}

  @Get('barbearias/:slug')
  async buscarBarbeariaPorSlug(@Param('slug') slug: string) {
    const barbearia = await this.repo.buscarBarbeariaPorSlug(slug);
    if (!barbearia) throw new NotFoundException('Barbearia não encontrada');
    return barbearia;
  }
}
