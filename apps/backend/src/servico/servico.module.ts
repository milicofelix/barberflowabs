import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ServicoController } from './servico.controller';
import { ServicoPrisma } from './servico.prisma';
import { DbModule } from 'src/db/db.module';
import { TenantService } from 'src/shared/tenant.service';
import { AuthModule } from 'src/auth/auth.module';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { SaasModule } from 'src/saas/saas.module';
import { EquipeModule } from 'src/equipe/equipe.module';

@Module({
  imports: [AuthModule, DbModule, SaasModule, EquipeModule],
  controllers: [ServicoController],
  providers: [ServicoPrisma, TenantService],
})
export class ServicoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: 'servicos', method: RequestMethod.POST },
      { path: 'servicos/sugeridos/importar', method: RequestMethod.POST },
      { path: 'servicos/:id', method: RequestMethod.PUT },
      { path: 'servicos/:id', method: RequestMethod.DELETE },
    );
  }
}
