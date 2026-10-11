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
