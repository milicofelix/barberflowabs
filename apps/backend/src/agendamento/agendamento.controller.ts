import {
  Usuario,
  Agendamento,
  NovoAgendamento,
  ExcluirAgendamento,
  TEMPO_SLOT,
} from '@barbabrutal/core';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { UsuarioLogado } from 'src/shared/usuario.decorator';
import { AgendamentoPrisma } from './agendamento.prisma';

@Controller('agendamentos')
export class AgendamentoController {
  constructor(private readonly repo: AgendamentoPrisma) {}

  @Post()
  async novoAgendamento(
    @Body() dados: Agendamento,
    @UsuarioLogado() usuario: Usuario,
  ) {
    const agendamento: Agendamento = {
      ...dados,
      barbeariaId: usuario.barbeariaId,
      data: new Date(dados.data),
      usuario,
    };
    const casoDeUso = new NovoAgendamento(this.repo);
    await casoDeUso.executar({ agendamento, usuario });
  }

  @Get()
  buscarAgendamentosCliente(@UsuarioLogado() usuario: Usuario) {
    return this.repo.buscarPorEmail(usuario.email, usuario.barbeariaId);
  }

  @Get(':profissional/:data')
  buscarAgendaProfissionalPorDia(
    @Param('profissional') profissional: string,
    @Param('data') data: string,
    @UsuarioLogado() usuario: Usuario,
  ) {
    return this.repo.buscarPorProfissionalEData(
      +profissional,
      new Date(data),
      usuario.barbeariaId,
    );
  }

  @Get('ocupacao/:profissional/:data')
  async buscarOcupacaoPorProfissionalEData(
    @Param('profissional') profissional: string,
    @Param('data') dataParam: string,
    @UsuarioLogado() usuario: Usuario,
  ) {
    const agendamentos = await this.repo.buscarPorProfissionalEData(
      +profissional,
      new Date(dataParam),
      usuario.barbeariaId,
    );

    return agendamentos
      .map((agendamento) => {
        return {
          data: agendamento.data,
          slots: agendamento.servicos.reduce((total, s) => total + s.qtdeSlots, 0),
        };
      })
      .reduce((horariosOcupados: Date[], dados: any) => {
        const horario = dados.data;
        const slots = dados.slots;
        const horarios = Array.from({ length: slots }, (_, i) =>
          new Date(horario.getTime() + i * TEMPO_SLOT * 60000),
        );
        return [...horariosOcupados, ...horarios];
      }, [])
      .map((d) => d.toTimeString().slice(0, 5));
  }

  @Delete(':id')
  async excluirAgendamento(
    @Param('id') id: string,
    @UsuarioLogado() usuario: Usuario,
  ) {
    const casoDeUso = new ExcluirAgendamento(this.repo);
    await casoDeUso.executar({
      id: +id,
      usuario,
    });
  }
}
