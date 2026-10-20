import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { DbModule } from 'src/db/db.module';
import { AgendaController } from './agenda.controller';
import { AgendaPrisma } from './agenda.prisma';
import { TenantService } from 'src/shared/tenant.service';
import { MotorAgendaModule } from 'src/motor-agenda/motor-agenda.module';
import { EquipeModule } from 'src/equipe/equipe.module';

@Module({
  imports: [AuthModule, DbModule, MotorAgendaModule, EquipeModule],
  controllers: [AgendaController],
  providers: [AgendaPrisma, TenantService],
})
export class AgendaModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(AgendaController);
  }
}
