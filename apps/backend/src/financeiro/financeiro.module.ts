import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { EquipeModule } from 'src/equipe/equipe.module';
import { ComissaoService } from './comissao.service';
import { FinanceiroController } from './financeiro.controller';
import { FinanceiroRepository } from './financeiro.repository';
import { FinanceiroService } from './financeiro.service';
import { GatewayController } from './gateway.controller';
import { CaixaRepository } from './caixa.repository';
import { CobrancaRepository } from './cobranca.repository';
import { RepasseRepository } from './repasse.repository';

@Module({
  imports: [AuthModule, DbModule, EquipeModule],
  controllers: [FinanceiroController, GatewayController],
  providers: [FinanceiroRepository, CaixaRepository, CobrancaRepository, RepasseRepository, FinanceiroService, ComissaoService],
  exports: [FinanceiroService],
})
export class FinanceiroModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(FinanceiroController);
  }
}
