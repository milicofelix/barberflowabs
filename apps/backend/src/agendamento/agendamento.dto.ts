export type CriarAgendamentoDto = {
  data: string;
  usuario: {
    id: number;
  };
  profissional: {
    id: number;
  };
  servicos: Array<{
    id: number;
  }>;
};

export type AvaliarAgendamentoDto = {
  nota: number;
  comentario?: string;
};
