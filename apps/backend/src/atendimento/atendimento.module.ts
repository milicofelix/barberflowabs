import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { FinanceiroModule } from 'src/financeiro/financeiro.module';
import { FluxoAtendimentoService } from 'src/gestao/fluxo-atendimento.service';
import { AgendaAtualizacaoService } from 'src/motor-agenda/agenda-atualizacao.service';
import { AtendimentoWorker } from './atendimento.worker';
import { OrquestradorAtendimentoService } from './orquestrador-atendimento.service';

@Module({
  imports: [DbModule, FinanceiroModule],
  providers: [
    FluxoAtendimentoService,
    AgendaAtualizacaoService,
    OrquestradorAtendimentoService,
    AtendimentoWorker,
  ],
  exports: [FluxoAtendimentoService, AgendaAtualizacaoService, OrquestradorAtendimentoService],
})
export class AtendimentoModule {}
