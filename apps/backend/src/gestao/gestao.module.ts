import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { GestaoController } from './gestao.controller';
import { GestaoPrisma } from './gestao.prisma';
import { EquipeModule } from 'src/equipe/equipe.module';
import { FinanceiroModule } from 'src/financeiro/financeiro.module';
import { MotorAgendaModule } from 'src/motor-agenda/motor-agenda.module';
import { AgendaOperacionalService } from './agenda-operacional.service';

@Module({
  imports: [AuthModule, DbModule, EquipeModule, FinanceiroModule, MotorAgendaModule],
  controllers: [GestaoController],
  providers: [GestaoPrisma, AgendaOperacionalService],
})
export class GestaoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(GestaoController);
  }
}
