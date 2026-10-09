import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { PublicoController } from './publico.controller';
import { PublicoPrisma } from './publico.prisma';
import { EstabelecimentoPublicoController } from './estabelecimento-publico.controller';

@Module({
  imports: [DbModule],
  controllers: [PublicoController, EstabelecimentoPublicoController],
  providers: [PublicoPrisma],
})
export class PublicoModule {}
