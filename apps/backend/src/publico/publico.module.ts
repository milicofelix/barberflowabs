import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { PublicoController } from './publico.controller';
import { PublicoPrisma } from './publico.prisma';
import { EstabelecimentoPublicoController } from './estabelecimento-publico.controller';
import { MarketplaceController } from './marketplace.controller';
import { MarketplacePrisma } from './marketplace.prisma';

@Module({
  imports: [DbModule],
  controllers: [PublicoController, EstabelecimentoPublicoController, MarketplaceController],
  providers: [PublicoPrisma, MarketplacePrisma],
})
export class PublicoModule {}
