export type CriarEstabelecimentoDto = {
  nome: string;
  slug: string;
  email?: string;
  telefone?: string;
};

export type AtualizarPerfilPublicoEstabelecimentoDto = {
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
