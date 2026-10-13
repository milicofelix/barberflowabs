export interface HorariosDisponiveisDto {
  manha: string[];
  tardeNoite: string[];
}

export interface HorarioFuncionamentoDto {
  id?: number;
  diaSemana: number;
  inicio: string;
  fim: string;
  intervaloInicio?: string | null;
  intervaloFim?: string | null;
  ativo?: boolean;
}

export interface ConfiguracaoAgendaDto {
  antecedenciaMinutos: number;
  fusoHorario: string;
  horarios: HorarioFuncionamentoDto[];
}
