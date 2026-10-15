import { Controller, Get, Query } from '@nestjs/common';
import { CatalogoPublicoPrisma } from './catalogo-publico.prisma';

@Controller('public/catalogo')
export class CatalogoPublicoController {
  constructor(private readonly catalogo: CatalogoPublicoPrisma) {}
  @Get('segmentos') segmentos() { return this.catalogo.segmentos(); }
  @Get('servicos') servicos(@Query() query: Record<string, unknown>) { return this.catalogo.listar('servicos', query); }
  @Get('profissionais') profissionais(@Query() query: Record<string, unknown>) { return this.catalogo.listar('profissionais', query); }
}
