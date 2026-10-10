import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { EstabelecimentoController } from './estabelecimento.controller';
import { EstabelecimentoPrisma } from './estabelecimento.prisma';

@Module({
  imports: [AuthModule, DbModule],
  controllers: [EstabelecimentoController],
  providers: [EstabelecimentoPrisma],
})
export class EstabelecimentoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({
      path: 'estabelecimentos/minha/perfil-publico',
      method: RequestMethod.ALL,
    });
  }
}
