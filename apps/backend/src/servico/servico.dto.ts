export type CriarServicoDto = {
  nome: string;
  descricao: string;
  preco: number;
  qtdeSlots: number;
  imagemURL: string;
  observacoes?: string | null;
  modeloAtendimento?: 'PRESENCIAL' | 'DOMICILIAR' | 'HIBRIDO';
  duracaoMinutos?: number;
  preparoAntesMinutos?: number;
  preparoDepoisMinutos?: number;
  deslocamentoMinutos?: number;
  profissionalIds?: number[];
};
