import { Module } from '@nestjs/common';
import { ServicoController } from './servico.controller';
import { ServicoPrisma } from './servico.prisma';
import { DbModule } from 'src/db/db.module';

@Module({
  imports: [DbModule],
  controllers: [ServicoController],
  providers: [ServicoPrisma],
})
export class ServicoModule {}
