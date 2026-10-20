export interface SalvarRecursoDto {
  nome: string;
  tipo: string;
  capacidade: number;
  unidadeId?: number | null;
  ativo?: boolean;
}

export interface SalvarIndisponibilidadeRecursoDto {
  inicio: string;
  fim: string;
  motivo?: string | null;
  ativo?: boolean;
}
