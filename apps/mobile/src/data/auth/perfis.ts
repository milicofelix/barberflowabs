import type { Usuario } from '@barbabrutal/core'

export type PerfilUsuario =
    | 'CUSTOMER'
    | 'BARBER'
    | 'BARBERSHOP_OWNER'
    | 'SUPER_ADMIN'
    | 'APP_OWNER'

export function resolverPerfil(usuario: Usuario | null): PerfilUsuario | null {
    if (!usuario) return null

    const perfil = String(usuario.papel ?? usuario.role ?? '').toUpperCase()

    if (perfil === 'APP_OWNER') return 'APP_OWNER'
    if (perfil === 'SUPER_ADMIN') return 'SUPER_ADMIN'
    if (perfil === 'BARBERSHOP_OWNER') return 'BARBERSHOP_OWNER'
    if (perfil === 'BARBER' || usuario.barbeiro) return 'BARBER'
    return 'CUSTOMER'
}

export function perfilAdmin(perfil: PerfilUsuario | null) {
    return perfil === 'SUPER_ADMIN' || perfil === 'APP_OWNER'
}

export function perfilOperacional(perfil: PerfilUsuario | null) {
    return perfil === 'BARBER' || perfil === 'BARBERSHOP_OWNER'
}
