import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { TenantService } from 'src/shared/tenant.service';
import { CatalogoController } from './catalogo.controller';
import { CatalogoPolicy } from './catalogo.policy';
import { CatalogoPrisma } from './catalogo.prisma';
import { CatalogoService } from './catalogo.service';
import { CatalogoConsultaPrisma } from './catalogo-consulta.prisma';
import { CatalogoIntegridadePrisma } from './catalogo-integridade.prisma';

@Module({
  imports: [AuthModule, DbModule],
  controllers: [CatalogoController],
  providers: [
    CatalogoPrisma,
    CatalogoConsultaPrisma,
    CatalogoIntegridadePrisma,
    CatalogoService,
    CatalogoPolicy,
    TenantService,
  ],
})
export class CatalogoModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      { path: 'catalogo/estabelecimento', method: RequestMethod.PUT },
      { path: 'catalogo/profissionais/:id/especialidades', method: RequestMethod.PUT },
      { path: 'catalogo/servicos/:id', method: RequestMethod.PUT },
    );
  }
}
