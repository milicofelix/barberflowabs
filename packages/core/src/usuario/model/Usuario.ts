export default interface Usuario {
    id?: number
    barbeariaId?: number
    nome: string
    email: string
    senha?: string
    telefone?: string
    dataNascimento?: string | null
    barbeiro?: boolean
    papel?: 'SUPER_ADMIN' | 'BARBER' | 'CUSTOMER'
    role?: 'SUPER_ADMIN' | 'BARBER' | 'CUSTOMER'
}
