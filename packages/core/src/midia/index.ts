export type FinalidadeMidia = 'AVATAR' | 'SERVICO' | 'PROFISSIONAL' | 'CAPA'
export type EntidadeMidia = 'USUARIO' | 'SERVICO' | 'PROFISSIONAL' | 'ESTABELECIMENTO'

export interface VersaoMidia {
    url: string
    largura: number
    altura: number
    bytes: number
}

export interface ImagemGaleria {
    id: string
    titulo: string
    finalidade: FinalidadeMidia
    segmentoSlug: string | null
    versoes: Record<string, VersaoMidia>
}

export interface AssociacaoMidia {
    midiaId: string | null
    entidade: EntidadeMidia
    entidadeId?: number
}

export interface ResultadoAssociacaoMidia {
    midiaId: string | null
    entidade: EntidadeMidia
    entidadeId: number
    imagemURL: string | null
}
