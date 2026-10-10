export interface SalvarComissaoDto {
  profissionalId?: number | null;
  servicoId?: number | null;
  percentual: number;
  ativo?: boolean;
}

export interface SalvarFormaPagamentoDto {
  nome: string;
  tipo: string;
  taxaPercentual?: number;
  taxaFixa?: number;
  prazoRecebimento?: number;
  ativa?: boolean;
}

export interface CriarContaDto {
  tipo: string;
  descricao: string;
  categoria?: string;
  documento?: string;
  valorOriginal: number;
  competencia: string;
  vencimento: string;
  agendamentoId?: number;
  observacoes?: string;
}

export interface BaixarContaDto {
  valorPago: number;
  pagoEm: string;
  formaPagamentoId?: number;
}

export interface AbrirCaixaDto {
  saldoInicial?: number;
  observacoes?: string;
}

export interface FecharCaixaDto {
  saldoInformado: number;
  observacoes?: string;
}

export interface CalcularRepassesDto {
  inicio: string;
  fim: string;
}

export interface ConciliarDto {
  contaFinanceiraId?: number;
  provedor: string;
  transacaoExternaId: string;
  valorEsperado: number;
  valorRecebido: number;
  observacoes?: string;
}
