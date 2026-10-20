import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { MotorAgendaCalculador } from './motor-agenda.calculador';
import { MotorAgendaComandoPrisma } from './motor-agenda.comando.prisma';
import { MotorAgendaConsultaPrisma } from './motor-agenda.consulta.prisma';
import { MotorAgendaDisponibilidadePrisma } from './motor-agenda.disponibilidade.prisma';
import { MotorAgendaPolicy } from './motor-agenda.policy';
import { MotorAgendaService } from './motor-agenda.service';
import { RelacionamentoModule } from 'src/relacionamento/relacionamento.module';
import { AtendimentoModule } from 'src/atendimento/atendimento.module';

@Module({
  imports: [DbModule, RelacionamentoModule, AtendimentoModule],
  providers: [
    MotorAgendaCalculador,
    MotorAgendaComandoPrisma,
    MotorAgendaConsultaPrisma,
    MotorAgendaDisponibilidadePrisma,
    MotorAgendaPolicy,
    MotorAgendaService,
  ],
  exports: [MotorAgendaService, AtendimentoModule],
})
export class MotorAgendaModule {}
