export type CriarBarbeariaDto = {
  nome: string;
  slug: string;
  email?: string;
  telefone?: string;
};

export type AtualizarPerfilPublicoBarbeariaDto = {
  nomePublico?: string;
  descricaoPublica?: string;
  imagemCapaURL?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  aceitaAgendamentoOnline?: boolean;
  observacaoRevisao?: string;
};
