import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { AgendamentoModule } from './agendamento/agendamento.module';
import { ProfissionalModule } from './profissional/profissional.module';
import { ServicoModule } from './servico/servico.module';
import { BarbeariaModule } from './barbearia/barbearia.module';
import { AgendaModule } from './agenda/agenda.module';
import { GestaoModule } from './gestao/gestao.module';
import { SaasModule } from './saas/saas.module';
import { PublicoModule } from './publico/publico.module';

@Module({
  imports: [
    AuthModule,
    DbModule,
    AgendamentoModule,
    ProfissionalModule,
    ServicoModule,
    BarbeariaModule,
    AgendaModule,
    GestaoModule,
    SaasModule,
    PublicoModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
