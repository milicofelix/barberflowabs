import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { PublicoPrisma } from './publico.prisma';
import { EstabelecimentoPublicoController } from './estabelecimento-publico.controller';
import { MarketplaceController } from './marketplace.controller';
import { MarketplacePrisma } from './marketplace.prisma';

@Module({
  imports: [DbModule],
  controllers: [EstabelecimentoPublicoController, MarketplaceController],
  providers: [PublicoPrisma, MarketplacePrisma],
})
export class PublicoModule {}
