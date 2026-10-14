import { PermissaoEquipe } from './equipe.constants';

export interface SalvarMembroEquipeDto {
  usuarioId: number;
  profissionalId?: number | null;
  papel: string;
  permissoes: PermissaoEquipe[];
  ativo?: boolean;
}

export interface CriarContaMembroDto {
  nome?: string;
  email: string;
  senhaTemporaria: string;
  profissionalId?: number | null;
  papel: string;
  permissoes: PermissaoEquipe[];
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

