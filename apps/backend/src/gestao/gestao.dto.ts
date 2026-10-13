export interface AtualizarStatusAgendamentoDto {
  status: string;
}

export interface ConsultarAgendaPeriodoDto {
  inicio: string;
  fim: string;
  unidadeId?: string;
  profissionalId?: string;
  recursoId?: string;
  servicoId?: string;
  status?: string;
  cursor?: string;
  limite?: string;
}

export interface CriarAgendamentoAssistidoDto {
  clienteId: number;
  data: string;
  profissional: { id: number };
  servicos: Array<{ id: number }>;
  unidadeId?: number | null;
  modeloAtendimento?: 'PRESENCIAL' | 'DOMICILIAR' | 'HIBRIDO';
  enderecoAtendimento?: string | null;
  deslocamentoMinutos?: number;
  origem?: 'RECEPCAO' | 'TELEFONE' | 'WHATSAPP' | 'PRESENCIAL' | 'OUTRO';
  observacoes?: string | null;
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
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  senha?: string;
}

export interface ContatoImportacaoDto {
  referencia: string;
  nome: string;
  telefone?: string;
  email?: string;
}

export interface SimularImportacaoContatosDto {
  chaveIdempotencia: string;
  contatos: ContatoImportacaoDto[];
}

export interface ConfirmarImportacaoContatosDto {
  contatos: ContatoImportacaoDto[];
  confirmarCorrespondencias?: boolean;
}

export interface CriarLembreteRelacionamentoDto {
  usuarioId?: number;
  agendamentoId?: number;
  tipo: string;
  canal?: string;
  mensagem: string;
  dataPrevista: string;
}

export interface AtualizarStatusLembreteDto {
  status: string;
}
