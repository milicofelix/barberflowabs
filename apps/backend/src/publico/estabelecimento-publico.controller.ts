import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { validarDenunciaPerfilPublico } from './denuncia-perfil-publico.validation';
import { PublicoPrisma } from './publico.prisma';

@Controller('public/estabelecimentos')
export class EstabelecimentoPublicoController {
  constructor(private readonly repo: PublicoPrisma) {}

  @Get()
  listar(@Query() filtros: any) {
    return this.repo.listarBarbearias(filtros);
  }

  @Get(':slug')
  async buscarPorSlug(@Param('slug') slug: string) {
    const estabelecimento = await this.repo.buscarBarbeariaPorSlug(slug);
    if (!estabelecimento) throw new NotFoundException('Estabelecimento não encontrado');
    return estabelecimento;
  }

  @Post(':slug/denuncias')
  denunciar(@Param('slug') slug: string, @Body() dados: any) {
    validarDenunciaPerfilPublico(dados);
    return this.repo.denunciarPerfil(slug, dados);
  }
}
