import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { PublicoController } from './publico.controller';
import { PublicoPrisma } from './publico.prisma';

@Module({
  imports: [DbModule],
  controllers: [PublicoController],
  providers: [PublicoPrisma],
})
export class PublicoModule {}
