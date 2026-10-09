import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { MotorAgendaCalculador } from './motor-agenda.calculador';
import { MotorAgendaComandoPrisma } from './motor-agenda.comando.prisma';
import { MotorAgendaConsultaPrisma } from './motor-agenda.consulta.prisma';
import { MotorAgendaDisponibilidadePrisma } from './motor-agenda.disponibilidade.prisma';
import { MotorAgendaPolicy } from './motor-agenda.policy';
import { MotorAgendaService } from './motor-agenda.service';

@Module({
  imports: [DbModule],
  providers: [
    MotorAgendaCalculador,
    MotorAgendaComandoPrisma,
    MotorAgendaConsultaPrisma,
    MotorAgendaDisponibilidadePrisma,
    MotorAgendaPolicy,
    MotorAgendaService,
  ],
  exports: [MotorAgendaService],
})
export class MotorAgendaModule {}
