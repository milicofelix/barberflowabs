import { Injectable } from '@nestjs/common';
import { ModeloAtendimento } from 'src/estabelecimento/estabelecimento.constants';
import { ServicoAgenda } from './motor-agenda.dto';

export interface PeriodoAgenda {
  data: Date;
  dataFim: Date;
  inicioOcupacao: Date;
  fimOcupacao: Date;
  duracaoMinutos: number;
  preparoAntesMinutos: number;
  preparoDepoisMinutos: number;
  deslocamentoMinutos: number;
  valorTotal: number;
}

@Injectable()
export class MotorAgendaCalculador {
  calcular(
    data: Date,
    servicos: ServicoAgenda[],
    modeloAtendimento: ModeloAtendimento,
    deslocamentoSolicitado = 0,
  ): PeriodoAgenda {
    const preparoAntes = servicos[0]?.preparoAntesMinutos ?? 0;
    const preparoDepois = servicos[servicos.length - 1]?.preparoDepoisMinutos ?? 0;
    const transicoes = servicos.slice(1).reduce((total, atual, indice) => {
      const anterior = servicos[indice];
      return total + Math.max(anterior.preparoDepoisMinutos, atual.preparoAntesMinutos);
    }, 0);
    const duracao = servicos.reduce((total, servico) => total + servico.duracaoMinutos, 0) + transicoes;
    const deslocamentoPadrao = Math.max(0, ...servicos.map((servico) => servico.deslocamentoMinutos));
    const deslocamento = modeloAtendimento === 'DOMICILIAR'
      ? Math.max(deslocamentoSolicitado, deslocamentoPadrao)
      : 0;
    const dataFim = this.adicionarMinutos(data, duracao);

    return {
      data,
      dataFim,
      inicioOcupacao: this.adicionarMinutos(data, -(preparoAntes + deslocamento)),
      fimOcupacao: this.adicionarMinutos(dataFim, preparoDepois + deslocamento),
      duracaoMinutos: duracao,
      preparoAntesMinutos: preparoAntes,
      preparoDepoisMinutos: preparoDepois,
      deslocamentoMinutos: deslocamento,
      valorTotal: servicos.reduce((total, servico) => total + Number(servico.preco), 0),
    };
  }

  private adicionarMinutos(data: Date, minutos: number) {
    return new Date(data.getTime() + minutos * 60_000);
  }
}
