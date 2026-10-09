import { Controller, Get, Query } from '@nestjs/common';
import { MarketplaceFiltrosDto } from './marketplace.dto';
import { MarketplacePrisma } from './marketplace.prisma';

@Controller('public/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplacePrisma) {}

  @Get()
  listar(@Query() filtros: MarketplaceFiltrosDto) {
    return this.marketplace.listar(filtros);
  }

  @Get('categorias')
  listarCategorias() {
    return this.marketplace.listarCategorias();
  }
}
