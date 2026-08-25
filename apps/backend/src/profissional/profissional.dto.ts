export type CriarProfissionalDto = {
  nome: string;
  descricao: string;
  imagemURL: string;
  avaliacao?: number;
  quantidadeAvaliacoes?: number;
};
