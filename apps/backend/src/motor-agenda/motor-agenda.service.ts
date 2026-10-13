import { Injectable } from '@nestjs/common';
import { MotorAgendaCalculador } from './motor-agenda.calculador';
import { MotorAgendaComandoPrisma } from './motor-agenda.comando.prisma';
import { MotorAgendaConsultaPrisma } from './motor-agenda.consulta.prisma';
import { MotorAgendaDisponibilidadePrisma } from './motor-agenda.disponibilidade.prisma';
import {
  ConsultarDisponibilidadeDto,
  CriarAgendamentoUniversalDto,
  ReagendarAgendamentoDto,
} from './motor-agenda.dto';
import { MotorAgendaPolicy } from './motor-agenda.policy';

@Injectable()
export class MotorAgendaService {
  constructor(
    private readonly consulta: MotorAgendaConsultaPrisma,
    private readonly comando: MotorAgendaComandoPrisma,
    private readonly disponibilidade: MotorAgendaDisponibilidadePrisma,
    private readonly calculador: MotorAgendaCalculador,
    private readonly policy: MotorAgendaPolicy,
  ) {}

  async criar(
    estabelecimentoId: number,
    dados: CriarAgendamentoUniversalDto,
    usuario: any,
  ) {
    this.policy.validarCriacao(dados, usuario);
    const data = this.policy.validarData(dados.data);
    const contexto = await this.carregarContexto(estabelecimentoId, dados);
    this.validarContexto(contexto, dados.enderecoAtendimento);
    const periodo = this.calculador.calcular(
      data,
      contexto.servicos,
      contexto.modeloAtendimento,
      Number(dados.deslocamentoMinutos ?? 0),
    );
    await this.consulta.validarHorarioFuncionamento(
      estabelecimentoId,
      contexto.unidadeId,
      periodo.inicioOcupacao,
      periodo.fimOcupacao,
    );
    return this.comando.criar({
      contexto,
      periodo,
      usuarioId: usuario.id,
      enderecoAtendimento: dados.enderecoAtendimento,
    });
  }

  async consultarDisponibilidade(estabelecimentoId: number, dados: ConsultarDisponibilidadeDto) {
    this.policy.validarDisponibilidade(dados);
    const contexto = await this.consulta.carregarContexto({
      estabelecimentoId,
      profissionalId: Number(dados.profissionalId),
      servicoIds: dados.servicoIds.map(Number),
      unidadeId: dados.unidadeId,
      modeloAtendimento: dados.modeloAtendimento,
    });
    this.validarContexto(contexto, dados.enderecoAtendimento);
    const periodo = this.calculador.calcular(
      new Date(dados.data),
      contexto.servicos,
      contexto.modeloAtendimento,
      Number(dados.deslocamentoMinutos ?? 0),
    );
    await this.consulta.validarHorarioFuncionamento(
      estabelecimentoId,
      contexto.unidadeId,
      periodo.inicioOcupacao,
      periodo.fimOcupacao,
    );
    const recursos = await this.disponibilidade.consultar(
      contexto,
      periodo,
      dados.agendamentoIgnoradoId ? Number(dados.agendamentoIgnoradoId) : undefined,
    );
    return { disponivel: true, periodo, recursos };
  }

  async reagendar(
    id: number,
    estabelecimentoId: number,
    dados: ReagendarAgendamentoDto,
    usuario: any,
  ) {
    const agendamento = await this.consulta.obterParaReagendar(id, estabelecimentoId);
    this.policy.validarReagendamento(agendamento, usuario);
    const data = this.policy.validarData(dados.data);
    this.policy.validarDeslocamento(dados.deslocamentoMinutos);
    const contexto = await this.consulta.carregarContexto({
      estabelecimentoId,
      profissionalId: agendamento.profissionalId,
      servicoIds: agendamento.itens.map((item) => item.servicoId),
      unidadeId: dados.unidadeId ?? agendamento.unidadeId,
      modeloAtendimento: agendamento.modeloAtendimento,
    });
    contexto.servicos = this.aplicarSnapshots(contexto.servicos, agendamento.itens);
    const endereco = dados.enderecoAtendimento ?? agendamento.enderecoAtendimento;
    this.validarContexto(contexto, endereco);
    const periodo = this.calculador.calcular(
      data,
      contexto.servicos,
      contexto.modeloAtendimento,
      Number(dados.deslocamentoMinutos ?? agendamento.deslocamentoMinutos ?? 0),
    );
    await this.consulta.validarHorarioFuncionamento(
      estabelecimentoId,
      contexto.unidadeId,
      periodo.inicioOcupacao,
      periodo.fimOcupacao,
    );
    return this.comando.reagendar({
      agendamento,
      contexto,
      periodo,
      alteradoPorId: usuario.id,
      enderecoAtendimento: endereco,
      motivo: dados.motivo,
    });
  }

  private carregarContexto(estabelecimentoId: number, dados: CriarAgendamentoUniversalDto) {
    return this.consulta.carregarContexto({
      estabelecimentoId,
      profissionalId: Number(dados.profissional.id),
      servicoIds: dados.servicos.map((servico) => Number(servico.id)),
      unidadeId: dados.unidadeId,
      modeloAtendimento: dados.modeloAtendimento,
    });
  }

  private validarContexto(contexto: any, endereco?: string | null) {
    this.policy.validarModelo(
      contexto.modeloAtendimento,
      contexto.modeloEstabelecimento,
      contexto.servicos,
      endereco,
    );
    this.policy.validarProfissional(contexto.profissionalId, contexto.servicos);
  }

  private aplicarSnapshots(servicos: any[], itens: any[]) {
    const porServico = new Map(itens.map((item) => [item.servicoId, item]));
    return servicos.map((servico) => {
      const item = porServico.get(servico.id);
      return {
        ...servico,
        duracaoMinutos: item.duracaoMinutos,
        preparoAntesMinutos: item.preparoAntesMinutos,
        preparoDepoisMinutos: item.preparoDepoisMinutos,
        preco: item.preco,
      };
    });
  }
}
