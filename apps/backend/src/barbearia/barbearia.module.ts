import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { BarbeariaController } from './barbearia.controller';
import { BarbeariaPrisma } from './barbearia.prisma';

@Module({
  imports: [DbModule],
  controllers: [BarbeariaController],
  providers: [BarbeariaPrisma],
})
export class BarbeariaModule {}
