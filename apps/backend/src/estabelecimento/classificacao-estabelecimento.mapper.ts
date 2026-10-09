import {
  MODELO_ATENDIMENTO_PADRAO,
  ModeloAtendimento,
  TIPO_ESTABELECIMENTO_PADRAO,
  TipoEstabelecimento,
} from './estabelecimento.constants';
import { ClassificacaoEstabelecimentoPublico } from './estabelecimento.contract';

export interface RegistroClassificacaoEstabelecimento {
  tipoEstabelecimento?: TipoEstabelecimento | null;
  modeloAtendimento?: ModeloAtendimento | null;
  segmentos?: Array<{
    principal: boolean;
    segmento: { id: number; slug: string; nome: string };
  }>;
  especialidades?: Array<{
    especialidade: {
      id: number;
      slug: string;
      nome: string;
      segmento: { id: number; slug: string; nome: string };
    };
  }>;
}

export function mapearClassificacaoEstabelecimento(
  registro: RegistroClassificacaoEstabelecimento,
): ClassificacaoEstabelecimentoPublico {
  return {
    tipoEstabelecimento: registro.tipoEstabelecimento ?? TIPO_ESTABELECIMENTO_PADRAO,
    modeloAtendimento: registro.modeloAtendimento ?? MODELO_ATENDIMENTO_PADRAO,
    segmentos: (registro.segmentos ?? []).map(({ principal, segmento }) => ({
      ...segmento,
      principal,
    })),
    especialidades: (registro.especialidades ?? []).map(({ especialidade }) => ({
      ...especialidade,
    })),
  };
}
