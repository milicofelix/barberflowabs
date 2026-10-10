import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { GestaoController } from './gestao.controller';
import { GestaoPrisma } from './gestao.prisma';
import { EquipeModule } from 'src/equipe/equipe.module';

@Module({
  imports: [AuthModule, DbModule, EquipeModule],
  controllers: [GestaoController],
  providers: [GestaoPrisma],
})
export class GestaoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(GestaoController);
  }
}
