export interface SalvarSolicitacaoEstabelecimentoDto {
  versao: number;
  nomePublico?: string | null;
  emailComercial?: string | null;
  telefoneComercial?: string | null;
  tipoEstabelecimento?: string | null;
  modeloAtendimento?: string | null;
  planoSlug?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  pontoReferencia?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  segmentoIds?: number[];
  especialidadeIds?: number[];
}

export interface EnviarSolicitacaoEstabelecimentoDto {
  versao: number;
  aceitouTermos: boolean;
  termosVersao: string;
}

export interface RevisarSolicitacaoEstabelecimentoDto {
  motivo?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
}
