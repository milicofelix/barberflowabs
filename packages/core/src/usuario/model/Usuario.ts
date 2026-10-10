export type PapelUsuario = 'SUPER_ADMIN' | 'APP_OWNER' | 'BARBERSHOP_OWNER' | 'BARBER' | 'CUSTOMER'

export default interface Usuario {
    id?: number
    barbeariaId?: number
    nome: string
    email: string
    senha?: string
    telefone?: string
    dataNascimento?: string | null
    barbeiro?: boolean
    papel?: PapelUsuario
    role?: PapelUsuario
}
