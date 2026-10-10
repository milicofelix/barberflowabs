export default interface Profissional {
    id: number
    estabelecimentoId?: number
    nome: string
    descricao: string
    imagemURL: string
    avaliacao: number
    quantidadeAvaliacoes: number
}
