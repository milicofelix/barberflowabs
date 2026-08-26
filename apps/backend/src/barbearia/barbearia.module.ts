import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { BarbeariaController } from './barbearia.controller';
import { BarbeariaPrisma } from './barbearia.prisma';

@Module({
  imports: [AuthModule, DbModule],
  controllers: [BarbeariaController],
  providers: [BarbeariaPrisma],
})
export class BarbeariaModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({
      path: 'barbearias/minha/perfil-publico',
      method: RequestMethod.ALL,
    });
  }
}
