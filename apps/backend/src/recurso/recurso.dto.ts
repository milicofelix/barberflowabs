export interface SalvarRecursoDto {
  nome: string;
  tipo: string;
  capacidade: number;
  unidadeId?: number | null;
  ativo?: boolean;
}
