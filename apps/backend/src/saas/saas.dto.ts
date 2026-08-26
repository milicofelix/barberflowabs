export interface OnboardingSaasDto {
  barbearia: {
    nome: string;
    slug: string;
    email?: string;
    telefone?: string;
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

export interface AtualizarStatusBarbeariaDto {
  status: string;
}

export interface RevisarBarbeariaDto {
  motivo?: string;
}

export interface AtualizarDestaqueBarbeariaDto {
  destaque: boolean;
}
