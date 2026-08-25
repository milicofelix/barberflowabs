import { Module } from '@nestjs/common';
import { ServicoController } from './servico.controller';
import { ServicoPrisma } from './servico.prisma';
import { DbModule } from 'src/db/db.module';
import { TenantService } from 'src/shared/tenant.service';

@Module({
  imports: [DbModule],
  controllers: [ServicoController],
  providers: [ServicoPrisma, TenantService],
})
export class ServicoModule {}
