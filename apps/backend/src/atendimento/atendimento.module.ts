import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { FinanceiroModule } from 'src/financeiro/financeiro.module';
import { FluxoAtendimentoService } from 'src/gestao/fluxo-atendimento.service';
import { AgendaAtualizacaoService } from 'src/motor-agenda/agenda-atualizacao.service';
import { AtendimentoWorker } from './atendimento.worker';
import { OrquestradorAtendimentoService } from './orquestrador-atendimento.service';
import { RetomarAutomacaoService } from './retomar-automacao.service';
import { MotorAgendaConsultaPrisma } from 'src/motor-agenda/motor-agenda.consulta.prisma';
import { MotorAgendaDisponibilidadePrisma } from 'src/motor-agenda/motor-agenda.disponibilidade.prisma';

@Module({
  imports: [DbModule, FinanceiroModule],
  providers: [
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
export class AtendimentoModule {}
