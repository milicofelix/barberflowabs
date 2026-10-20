import { ModeloAtendimento, TipoEstabelecimento } from 'src/estabelecimento/estabelecimento.constants';

export interface AtualizarCatalogoEstabelecimentoDto {
  tipoEstabelecimento: TipoEstabelecimento;
  modeloAtendimento: ModeloAtendimento;
  segmentoIds: number[];
  especialidadeIds: number[];
}

export interface ListarServicosSugeridosDto {
  segmentoIds?: number[];
  especialidadeIds?: number[];
  busca?: string;
}

export interface AtualizarEspecialidadesProfissionalDto {
  especialidadeIds: number[];
  especialidadePrincipalId?: number | null;
  servicoIds?: number[];
}

export interface RequisitoServicoDto {
  requisitoId: number;
  obrigatorio?: boolean;
  observacao?: string | null;
}

export interface AtualizarCatalogoServicoDto {
  especialidadeIds: number[];
  requisitos: RequisitoServicoDto[];
  observacoes?: string | null;
  modeloAtendimento: ModeloAtendimento;
  duracaoMinutos: number;
  preparoAntesMinutos?: number;
  preparoDepoisMinutos?: number;
  deslocamentoMinutos?: number;
  recursosNecessarios?: Array<{
    tipoRecurso: string;
    quantidade: number;
  }>;
}
