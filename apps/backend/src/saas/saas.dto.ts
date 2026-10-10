export interface OnboardingSaasDto {
  estabelecimento: {
    nome: string;
    slug: string;
    email?: string;
    telefone?: string;
    tipoEstabelecimento: string;
    modeloAtendimento: string;
    segmentoIds: number[];
    especialidadeIds: number[];
  };
  dono: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
  };
  planoSlug?: string;
}

export interface AtualizarPlanoDto {
  planoSlug: string;
}

export interface AtualizarStatusEstabelecimentoDto {
  status: string;
}

export interface RevisarEstabelecimentoDto {
  motivo?: string;
}

export interface AtualizarDestaqueEstabelecimentoDto {
  destaque: boolean;
}

export interface AtualizarComercialEstabelecimentoDto {
  comercialStatus: string;
  notasInternas?: string | null;
  ultimoContatoEm?: string | null;
  proximoContatoEm?: string | null;
}

export interface AtualizarPlanoAdminDto {
  nome?: string;
  descricao?: string;
  precoMensal?: number;
  limiteUsuarios?: number;
  limiteUnidades?: number;
  limiteServicos?: number;
  ativo?: boolean;
}

export interface RevisarDenunciaPerfilDto {
  status: string;
  resolucao?: string | null;
}
