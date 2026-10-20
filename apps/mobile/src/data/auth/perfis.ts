import type { Usuario } from '@uniflowabs/core'

export type PerfilUsuario =
    | 'CUSTOMER'
    | 'ESTABLISHMENT_MEMBER'
    | 'ESTABLISHMENT_OWNER'
    | 'SUPER_ADMIN'
    | 'APP_OWNER'

export function resolverPerfil(usuario: Usuario | null): PerfilUsuario | null {
    if (!usuario) return null

    const papeis = [usuario.papel, usuario.role].map(valor => String(valor ?? '').toUpperCase())
    if (papeis.includes('APP_OWNER')) return 'APP_OWNER'
    if (papeis.includes('SUPER_ADMIN')) return 'SUPER_ADMIN'

    const perfil = String(usuario.papel ?? usuario.role ?? '').toUpperCase()

    if (perfil === 'ESTABLISHMENT_OWNER') return 'ESTABLISHMENT_OWNER'
    if (perfil === 'ESTABLISHMENT_MEMBER' || usuario.membroEstabelecimento) return 'ESTABLISHMENT_MEMBER'
    return 'CUSTOMER'
}

export function perfilAdmin(perfil: PerfilUsuario | null) {
    return perfil === 'SUPER_ADMIN' || perfil === 'APP_OWNER'
}

export function perfilOperacional(perfil: PerfilUsuario | null) {
    return perfil === 'ESTABLISHMENT_MEMBER' || perfil === 'ESTABLISHMENT_OWNER'
}
