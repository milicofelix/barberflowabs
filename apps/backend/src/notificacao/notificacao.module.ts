import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { NotificacaoController } from './notificacao.controller';
import { NotificacaoRepository } from './notificacao.repository';
import { NotificacaoService } from './notificacao.service';

@Module({ imports: [AuthModule, DbModule], controllers: [NotificacaoController], providers: [NotificacaoRepository, NotificacaoService] })
export class NotificacaoModule {
  configure(consumer: MiddlewareConsumer) { consumer.apply(AuthMiddleware).forRoutes(NotificacaoController); }
}
