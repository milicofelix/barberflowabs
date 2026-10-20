import { CanalComunicacao, EventoTemplate } from './relacionamento.constants';

export interface AtualizarClienteDto {
  status?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  tags?: string[];
  observacoes?: string | null;
}

export interface PreferenciaComunicacaoDto {
  canal: CanalComunicacao;
  consentido: boolean;
  origem?: 'USUARIO' | 'ESTABELECIMENTO' | 'IMPORTACAO';
  versaoTermos?: string;
}

export interface SalvarPreferenciasDto {
  preferencias: PreferenciaComunicacaoDto[];
}

export interface SalvarTemplateDto {
  nome: string;
  evento: EventoTemplate;
  canal: CanalComunicacao;
  assunto?: string | null;
  conteudo: string;
  ativo?: boolean;
}

export interface EnfileirarComunicacaoDto {
  clienteId: number;
  templateId: number;
  chaveIdempotencia: string;
  tipo?: string;
  agendadoPara?: string;
  maximoTentativas?: number;
  variaveis?: Record<string, string | number>;
}

export interface ListarEnviosDto {
  status?: string;
  canal?: CanalComunicacao;
  pagina?: string;
  limite?: string;
}

export interface ReprocessarEnvioDto {
  tentativasAdicionais?: number;
}

export interface CallbackComunicacaoDto {
  eventoId: string;
  referenciaExterna?: string;
  tipo: 'ACEITO' | 'ENTREGUE' | 'ABERTO' | 'CLICADO' | 'FALHOU';
  payload?: Record<string, unknown>;
}
