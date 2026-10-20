export type PapelUsuario = 'SUPER_ADMIN' | 'APP_OWNER' | 'ESTABLISHMENT_OWNER' | 'ESTABLISHMENT_MEMBER' | 'CUSTOMER'

export default interface Usuario {
    id?: number
    estabelecimentoId?: number
    nome: string
    email: string
    senha?: string
    trocarSenhaObrigatoria?: boolean
    telefone?: string
    fotoURL?: string | null
    dataNascimento?: string | null
    membroEstabelecimento?: boolean
    papel?: PapelUsuario
    role?: PapelUsuario
}
