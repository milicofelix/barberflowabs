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
  ],
  controllers: [AppController],
})
export class AppModule {}
