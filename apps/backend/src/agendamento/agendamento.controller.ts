import {
  Usuario,
  Agendamento,
  NovoAgendamento,
  BuscarAgendamentosCliente,
  BuscarAgendaProfissionalPorDia,
  ExcluirAgendamento,
  ObterHorariosOcupados,
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
    const agendamento: Agendamento = { ...dados, data: new Date(dados.data) };
    const casoDeUso = new NovoAgendamento(this.repo);
    await casoDeUso.executar({ agendamento, usuario });
  }

  @Get()
  buscarAgendamentosCliente(@UsuarioLogado() usuario: Usuario) {
    const casoDeUso = new BuscarAgendamentosCliente(this.repo);
    return casoDeUso.executar(usuario);
  }

  @Get(':profissional/:data')
  buscarAgendaProfissionalPorDia(
    @Param('profissional') profissional: string,
    @Param('data') data: string,
  ) {
    const casoDeUso = new BuscarAgendaProfissionalPorDia(this.repo);
    return casoDeUso.executar({
      profissional: +profissional,
      data: new Date(data),
    });
  }

  @Get('ocupacao/:profissional/:data')
  buscarOcupacaoPorProfissionalEData(
    @Param('profissional') profissional: string,
    @Param('data') dataParam: string,
  ) {
    const casoDeUso = new ObterHorariosOcupados(this.repo);
    return casoDeUso.executar({
      profissionalId: +profissional,
      data: new Date(dataParam),
    });
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
