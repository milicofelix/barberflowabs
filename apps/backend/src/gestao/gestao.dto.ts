export interface AtualizarStatusAgendamentoDto {
  status: string;
}

export interface CriarLancamentoFinanceiroDto {
  tipo: string;
  descricao: string;
  valor: number;
  data: string;
  categoria?: string;
  profissionalId?: number;
  usuarioId?: number;
}

export interface SalvarClienteDto {
  nome: string;
  email: string;
  telefone?: string;
  senha?: string;
}
