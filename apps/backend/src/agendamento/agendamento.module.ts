import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AgendamentoController } from './agendamento.controller';
import { AuthModule } from 'src/auth/auth.module';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { DbModule } from 'src/db/db.module';
import { AgendamentoPrisma } from './agendamento.prisma';

@Module({
  imports: [AuthModule, DbModule],
  controllers: [AgendamentoController],
  providers: [AgendamentoPrisma],
})
export class AgendamentoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(AgendamentoController);
  }
}
