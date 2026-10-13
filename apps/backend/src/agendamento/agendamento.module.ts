import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AgendamentoController } from './agendamento.controller';
import { AuthModule } from 'src/auth/auth.module';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { DbModule } from 'src/db/db.module';
import { AgendamentoPrisma } from './agendamento.prisma';
import { SaasModule } from 'src/saas/saas.module';
import { TenantService } from 'src/shared/tenant.service';
import { MotorAgendaModule } from 'src/motor-agenda/motor-agenda.module';
import { RelacionamentoModule } from 'src/relacionamento/relacionamento.module';
import { AgendamentoAcaoController } from './agendamento-acao.controller';

@Module({
  imports: [AuthModule, DbModule, SaasModule, MotorAgendaModule, RelacionamentoModule],
  controllers: [AgendamentoController, AgendamentoAcaoController],
  providers: [AgendamentoPrisma, TenantService],
})
export class AgendamentoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(AgendamentoController);
  }
}
