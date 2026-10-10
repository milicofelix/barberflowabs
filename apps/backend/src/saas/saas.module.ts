import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { SaasController } from './saas.controller';
import { SaasPrisma } from './saas.prisma';
import { PlanoLimitesService } from './plano-limites.service';
import { FinanceiroModule } from 'src/financeiro/financeiro.module';

@Module({
  imports: [AuthModule, DbModule, FinanceiroModule],
  controllers: [SaasController],
  providers: [SaasPrisma, PlanoLimitesService],
  exports: [PlanoLimitesService],
})
export class SaasModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'saas/planos', method: RequestMethod.GET },
        { path: 'saas/onboarding', method: RequestMethod.POST },
      )
      .forRoutes(SaasController);
  }
}
