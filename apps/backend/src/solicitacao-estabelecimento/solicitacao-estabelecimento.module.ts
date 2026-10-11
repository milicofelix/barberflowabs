import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { SolicitacaoEstabelecimentoController } from './solicitacao-estabelecimento.controller';
import { SolicitacaoEstabelecimentoRepository } from './solicitacao-estabelecimento.repository';
import { SolicitacaoEstabelecimentoService } from './solicitacao-estabelecimento.service';

@Module({
  imports: [AuthModule, DbModule],
  controllers: [SolicitacaoEstabelecimentoController],
  providers: [SolicitacaoEstabelecimentoRepository, SolicitacaoEstabelecimentoService],
  exports: [SolicitacaoEstabelecimentoService],
})
export class SolicitacaoEstabelecimentoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(SolicitacaoEstabelecimentoController);
  }
}
