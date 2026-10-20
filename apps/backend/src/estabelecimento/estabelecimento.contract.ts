import { ModeloAtendimento, TipoEstabelecimento } from './estabelecimento.constants';

export interface SegmentoPublico {
  id: number;
  slug: string;
  nome: string;
  principal: boolean;
}

export interface EspecialidadePublica {
  id: number;
  slug: string;
  nome: string;
  segmento: Pick<SegmentoPublico, 'id' | 'slug' | 'nome'>;
}

export interface ClassificacaoEstabelecimentoPublico {
  tipoEstabelecimento: TipoEstabelecimento;
  modeloAtendimento: ModeloAtendimento;
  segmentos: SegmentoPublico[];
  especialidades: EspecialidadePublica[];
}
