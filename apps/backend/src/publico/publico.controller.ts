import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { PublicoPrisma } from './publico.prisma';
import { validarDenunciaPerfilPublico } from './denuncia-perfil-publico.validation';

@Controller('public')
export class PublicoController {
  constructor(private readonly repo: PublicoPrisma) {}

  @Get('barbearias')
  async listarBarbearias(@Query() filtros: any) {
    return this.repo.listarBarbearias(filtros);
  }

  @Get('barbearias/:slug')
  async buscarBarbeariaPorSlug(@Param('slug') slug: string) {
    const barbearia = await this.repo.buscarBarbeariaPorSlug(slug);
    if (!barbearia) throw new NotFoundException('Barbearia não encontrada');
    return barbearia;
  }

  @Post('barbearias/:slug/denuncias')
  async denunciarPerfil(@Param('slug') slug: string, @Body() dados: any) {
    validarDenunciaPerfilPublico(dados);
    return this.repo.denunciarPerfil(slug, dados);
  }
}
