import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AuthMiddleware } from 'src/auth/auth.middleware';
import { EquipeModule } from 'src/equipe/equipe.module';
import { OperacaoFluxoService } from './operacao-fluxo.service';
import { OperacaoFluxoController } from './operacao-fluxo.controller';
import { DbModule } from 'src/db/db.module';
import { FinanceiroModule } from 'src/financeiro/financeiro.module';
import { FluxoAtendimentoService } from 'src/gestao/fluxo-atendimento.service';
import { AgendaAtualizacaoService } from 'src/motor-agenda/agenda-atualizacao.service';
import { AtendimentoWorker } from './atendimento.worker';
import { OrquestradorAtendimentoService } from './orquestrador-atendimento.service';
import { RetomarAutomacaoService } from './retomar-automacao.service';
import { MotorAgendaConsultaPrisma } from 'src/motor-agenda/motor-agenda.consulta.prisma';
import { MotorAgendaDisponibilidadePrisma } from 'src/motor-agenda/motor-agenda.disponibilidade.prisma';
import { FidelidadeModule } from 'src/relacionamento/fidelidade/fidelidade.module';

@Module({
  imports: [DbModule, FinanceiroModule, AuthModule, EquipeModule, FidelidadeModule],
  controllers: [OperacaoFluxoController],
  providers: [
    OperacaoFluxoService,
    FluxoAtendimentoService,
    AgendaAtualizacaoService,
    OrquestradorAtendimentoService,
    AtendimentoWorker,
    RetomarAutomacaoService,
    MotorAgendaConsultaPrisma,
    MotorAgendaDisponibilidadePrisma,
  ],
  exports: [FluxoAtendimentoService, AgendaAtualizacaoService, OrquestradorAtendimentoService, RetomarAutomacaoService],
})
export class AtendimentoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(OperacaoFluxoController);
  }
}
