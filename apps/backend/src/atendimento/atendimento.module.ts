import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { FinanceiroModule } from 'src/financeiro/financeiro.module';
import { FluxoAtendimentoService } from 'src/gestao/fluxo-atendimento.service';
import { AgendaAtualizacaoService } from 'src/motor-agenda/agenda-atualizacao.service';

@Module({
  imports: [DbModule, FinanceiroModule],
  providers: [FluxoAtendimentoService, AgendaAtualizacaoService],
  exports: [FluxoAtendimentoService, AgendaAtualizacaoService],
})
export class AtendimentoModule {}
