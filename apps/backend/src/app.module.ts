import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { AgendamentoModule } from './agendamento/agendamento.module';
import { ProfissionalModule } from './profissional/profissional.module';
import { ServicoModule } from './servico/servico.module';
import { EstabelecimentoModule } from './estabelecimento/estabelecimento.module';
import { AgendaModule } from './agenda/agenda.module';
import { GestaoModule } from './gestao/gestao.module';
import { SaasModule } from './saas/saas.module';
import { PublicoModule } from './publico/publico.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { RecursoModule } from './recurso/recurso.module';
import { EquipeModule } from './equipe/equipe.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { RelacionamentoModule } from './relacionamento/relacionamento.module';
import { SolicitacaoEstabelecimentoModule } from './solicitacao-estabelecimento/solicitacao-estabelecimento.module';

@Module({
  imports: [
    AuthModule,
    DbModule,
    AgendamentoModule,
    ProfissionalModule,
    ServicoModule,
    EstabelecimentoModule,
    AgendaModule,
    GestaoModule,
    SaasModule,
    PublicoModule,
    CatalogoModule,
    RecursoModule,
    EquipeModule,
    FinanceiroModule,
    RelacionamentoModule,
    SolicitacaoEstabelecimentoModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
