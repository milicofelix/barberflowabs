import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { AuthModule } from 'src/auth/auth.module';
import { DbModule } from 'src/db/db.module';
import { EquipeModule } from 'src/equipe/equipe.module';
import { RelacionamentoController } from './relacionamento.controller';
import { RelacionamentoRepository } from './relacionamento.repository';
import { RelacionamentoService } from './relacionamento.service';
import { ComunicacaoCallbackController } from './comunicacao-callback.controller';
import { ComunicacaoWorker } from './comunicacao.worker';
import { ComunicacaoProviderRegistry, EmailSimuladoProvider, PushSimuladoProvider, WhatsappSimuladoProvider } from './comunicacao.provider';
import { JornadaAgendamentoService } from './jornada-agendamento.service';
import { AtendimentoModule } from 'src/atendimento/atendimento.module';

@Module({
  imports: [AuthModule, DbModule, EquipeModule, AtendimentoModule],
  controllers: [RelacionamentoController, ComunicacaoCallbackController],
  providers: [
    RelacionamentoRepository, RelacionamentoService, ComunicacaoWorker,
    ComunicacaoProviderRegistry, PushSimuladoProvider, EmailSimuladoProvider, WhatsappSimuladoProvider,
    JornadaAgendamentoService,
  ],
  exports: [RelacionamentoService, JornadaAgendamentoService],
})
export class RelacionamentoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(RelacionamentoController);
  }
}
