import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DbModule } from './db/db.module';
import { AgendamentoModule } from './agendamento/agendamento.module';
import { ProfissionalModule } from './profissional/profissional.module';
import { ServicoModule } from './servico/servico.module';
import { BarbeariaModule } from './barbearia/barbearia.module';

@Module({
  imports: [
    AuthModule,
    DbModule,
    AgendamentoModule,
    ProfissionalModule,
    ServicoModule,
    BarbeariaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
