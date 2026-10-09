export interface MarketplaceFiltrosDto {
  q?: string;
  cidade?: string;
  estado?: string;
  segmento?: string;
  especialidade?: string;
  precoMin?: string;
  precoMax?: string;
  notaMin?: string;
  abertaAgora?: string;
  disponivelEm?: string;
  lat?: string;
  lng?: string;
  raioKm?: string;
  ordenarPor?: 'RELEVANCIA' | 'PRECO' | 'AVALIACAO' | 'DISTANCIA';
  pagina?: string;
  limite?: string;
}
