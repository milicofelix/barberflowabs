import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { RecursoController } from './recurso.controller';
import { RecursoPolicy } from './recurso.policy';
import { RecursoPrisma } from './recurso.prisma';

@Module({
  imports: [AuthModule, DbModule],
  controllers: [RecursoController],
  providers: [RecursoPrisma, RecursoPolicy],
})
export class RecursoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(RecursoController);
  }
}
