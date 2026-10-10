import { PermissaoEquipe } from './equipe.constants';

export interface SalvarMembroEquipeDto {
  usuarioId: number;
  profissionalId?: number | null;
  papel: string;
  permissoes: PermissaoEquipe[];
  ativo?: boolean;
}

export interface SalvarEscalaDto {
  unidadeId?: number | null;
  diaSemana: number;
  inicio: string;
  fim: string;
  intervaloInicio?: string | null;
  intervaloFim?: string | null;
  ativo?: boolean;
}

export interface SalvarEscalasDto {
  escalas: SalvarEscalaDto[];
}

