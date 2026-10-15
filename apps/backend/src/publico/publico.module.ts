import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { PublicoPrisma } from './publico.prisma';
import { EstabelecimentoPublicoController } from './estabelecimento-publico.controller';
import { MarketplaceController } from './marketplace.controller';
import { MarketplacePrisma } from './marketplace.prisma';
import { CatalogoPublicoPrisma } from './catalogo-publico.prisma';
import { CatalogoPublicoController } from './catalogo-publico.controller';

@Module({
  imports: [DbModule],
  controllers: [EstabelecimentoPublicoController, MarketplaceController, CatalogoPublicoController],
  providers: [PublicoPrisma, MarketplacePrisma, CatalogoPublicoPrisma],
})
export class PublicoModule {}
