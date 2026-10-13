import { Controller, Get, Param, Post } from '@nestjs/common';
import { AgendaAtualizacaoService } from 'src/motor-agenda/agenda-atualizacao.service';
import { JornadaAgendamentoService } from 'src/relacionamento/jornada-agendamento.service';

@Controller('acoes-agendamento')
export class AgendamentoAcaoController {
  constructor(
    private readonly jornada: JornadaAgendamentoService,
    private readonly atualizacoes: AgendaAtualizacaoService,
  ) {}

  @Get(':token')
  obter(@Param('token') token: string) { return this.jornada.obterAcao(token); }

  @Post(':token/confirmar')
  async confirmar(@Param('token') token: string) {
    const resultado = await this.jornada.confirmarPorToken(token);
    this.atualizacoes.publicar(resultado.estabelecimentoId);
    return resultado;
  }

  @Post(':token/cancelar')
  async cancelar(@Param('token') token: string) {
    const resultado = await this.jornada.cancelarPorToken(token);
    this.atualizacoes.publicar(resultado.estabelecimentoId);
    return resultado;
  }
}
