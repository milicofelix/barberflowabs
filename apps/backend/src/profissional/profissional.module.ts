import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ProfissionalController } from './profissional.controller';
import { ProfissionalPrisma } from './profissional.prisma';
import { DbModule } from 'src/db/db.module';
import { TenantService } from 'src/shared/tenant.service';
import { AuthModule } from 'src/auth/auth.module';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { SaasModule } from 'src/saas/saas.module';
import { EquipeModule } from 'src/equipe/equipe.module';

@Module({
  imports: [AuthModule, DbModule, SaasModule, EquipeModule],
  controllers: [ProfissionalController],
  providers: [ProfissionalPrisma, TenantService],
})
export class ProfissionalModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: 'profissionais', method: RequestMethod.POST },
      { path: 'profissionais/:id', method: RequestMethod.PUT },
      { path: 'profissionais/:id', method: RequestMethod.DELETE },
    );
  }
}
