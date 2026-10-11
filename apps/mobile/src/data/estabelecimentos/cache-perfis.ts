import type { EstabelecimentoPerfil } from './tipos'

const DURACAO_CACHE_MS = 5 * 60 * 1000
const perfis = new Map<string, { dados: EstabelecimentoPerfil; expiraEm: number }>()

export function obterPerfilEmCache(slug: string) {
    const item = perfis.get(slug)
    if (!item || item.expiraEm <= Date.now()) {
        perfis.delete(slug)
        return null
    }
    return item.dados
}

export function guardarPerfilEmCache(slug: string, dados: EstabelecimentoPerfil) {
    perfis.set(slug, { dados, expiraEm: Date.now() + DURACAO_CACHE_MS })
}
