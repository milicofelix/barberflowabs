export type CriarProfissionalDto = {
  nome: string;
  sexo: 'MASCULINO' | 'FEMININO';
  descricao: string;
  imagemURL?: string;
  avaliacao?: number;
  quantidadeAvaliacoes?: number;
};
