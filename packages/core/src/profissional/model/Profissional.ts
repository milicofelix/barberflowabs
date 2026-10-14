export type SexoProfissional = 'MASCULINO' | 'FEMININO' | 'NAO_INFORMADO'

export default interface Profissional {
    id: number
    estabelecimentoId?: number
    nome: string
    sexo: SexoProfissional
    descricao: string
    imagemURL: string
    avaliacao: number
    quantidadeAvaliacoes: number
}
