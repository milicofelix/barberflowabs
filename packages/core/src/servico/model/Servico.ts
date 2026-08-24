export default interface Servico {
    id: number
    barbeariaId?: number
    nome: string
    descricao: string
    preco: number
    qtdeSlots: number
    imagemURL: string
}
