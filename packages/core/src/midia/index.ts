export type FinalidadeMidia = 'AVATAR' | 'SERVICO' | 'PROFISSIONAL' | 'CAPA' | 'LOGO'
export type ModoLogoEstabelecimento = 'PADRAO' | 'PERSONALIZADO' | 'OCULTO'
export interface ConfiguracaoLogoEstabelecimento { logoModo: ModoLogoEstabelecimento; logoURL: string | null }
export const OPCOES_LOGO_ESTABELECIMENTO: Array<{ modo: ModoLogoEstabelecimento; titulo: string }> = [
    { modo: 'PADRAO', titulo: 'Logo UniFlow ABS' },
    { modo: 'PERSONALIZADO', titulo: 'Logo do estabelecimento' },
    { modo: 'OCULTO', titulo: 'Não exibir logo' },
]
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
