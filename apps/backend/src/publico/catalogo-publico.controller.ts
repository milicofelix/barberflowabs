import { Controller, Get, Header, Query } from '@nestjs/common';
import { CatalogoPublicoPrisma } from './catalogo-publico.prisma';

@Controller('public/catalogo')
export class CatalogoPublicoController {
  constructor(private readonly catalogo: CatalogoPublicoPrisma) {}
  @Get('segmentos') segmentos() { return this.catalogo.segmentos(); }
  @Get('servicos') @Header('Cache-Control', 'no-store') servicos(@Query() query: Record<string, unknown>) { return this.catalogo.listar('servicos', query); }
  @Get('profissionais') @Header('Cache-Control', 'no-store') profissionais(@Query() query: Record<string, unknown>) { return this.catalogo.listar('profissionais', query); }
}
