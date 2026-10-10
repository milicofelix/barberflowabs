import { ModeloAtendimento } from 'src/estabelecimento/estabelecimento.constants';

export interface CriarAgendamentoUniversalDto {
  data: string;
  usuario: { id: number };
  profissional: { id: number };
  servicos: Array<{ id: number }>;
  unidadeId?: number | null;
  modeloAtendimento?: ModeloAtendimento;
  enderecoAtendimento?: string | null;
  deslocamentoMinutos?: number;
}

export interface ReagendarAgendamentoDto {
  data: string;
  unidadeId?: number | null;
  enderecoAtendimento?: string | null;
  deslocamentoMinutos?: number;
  motivo?: string | null;
}

export interface ConsultarDisponibilidadeDto {
  data: string;
  profissionalId: number;
  servicoIds: number[];
  unidadeId?: number | null;
  modeloAtendimento?: ModeloAtendimento;
  enderecoAtendimento?: string | null;
  deslocamentoMinutos?: number;
}

export interface ServicoAgenda {
  id: number;
  preco: unknown;
  modeloAtendimento: ModeloAtendimento;
  duracaoMinutos: number;
  preparoAntesMinutos: number;
  preparoDepoisMinutos: number;
  deslocamentoMinutos: number;
  recursosNecessarios?: Array<{ tipoRecurso: string; quantidade: number }>;
  profissionaisHabilitados?: Array<{ profissionalId: number; ativo: boolean }>;
}

export interface ContextoAgenda {
  estabelecimentoId: number;
  modeloEstabelecimento: ModeloAtendimento;
  modeloAtendimento: ModeloAtendimento;
  profissionalId: number;
  unidadeId: number | null;
  servicos: ServicoAgenda[];
}
