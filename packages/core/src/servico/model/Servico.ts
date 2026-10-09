export default interface Servico {
    id: number
    barbeariaId?: number
    nome: string
    descricao: string
    preco: number
    qtdeSlots: number
    imagemURL: string
    duracaoMinutos?: number
    preparoAntesMinutos?: number
    preparoDepoisMinutos?: number
    deslocamentoMinutos?: number
    modeloAtendimento?: 'PRESENCIAL' | 'DOMICILIAR' | 'HIBRIDO'
    observacoes?: string | null
}
