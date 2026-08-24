import { Module } from '@nestjs/common';
import { ProfissionalController } from './profissional.controller';
import { ProfissionalPrisma } from './profissional.prisma';
import { DbModule } from 'src/db/db.module';

@Module({
  imports: [DbModule],
  controllers: [ProfissionalController],
  providers: [ProfissionalPrisma],
})
export class ProfissionalModule {}
