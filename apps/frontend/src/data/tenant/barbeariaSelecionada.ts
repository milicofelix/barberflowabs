'use client'

const CHAVE_STORAGE = 'barberflowabs_barbearia_slug'
export const EVENTO_BARBEARIA_SELECIONADA = 'barberflowabs:barbearia-selecionada'

export const BARBEARIA_PADRAO = process.env.NEXT_PUBLIC_BARBEARIA_SLUG ?? 'barber-flow-abs'

export function obterBarbeariaSelecionada() {
    if (typeof window === 'undefined') return BARBEARIA_PADRAO

    const slugUrl = new URLSearchParams(window.location.search).get('barbearia')
    if (slugUrl) {
        return slugUrl
    }

    return window.localStorage.getItem(CHAVE_STORAGE) || BARBEARIA_PADRAO
}

export function temBarbeariaSelecionada() {
    if (typeof window === 'undefined') return false

    const slugUrl = new URLSearchParams(window.location.search).get('barbearia')
    return Boolean(slugUrl || window.localStorage.getItem(CHAVE_STORAGE))
}

export function salvarBarbeariaSelecionada(slug: string) {
    if (typeof window === 'undefined') return

    const slugLimpo = slug?.trim()
    if (!slugLimpo) return

    const slugAtual = window.localStorage.getItem(CHAVE_STORAGE)
    if (slugAtual === slugLimpo) return

    window.localStorage.setItem(CHAVE_STORAGE, slugLimpo)
    window.dispatchEvent(new CustomEvent(EVENTO_BARBEARIA_SELECIONADA, { detail: slugLimpo }))
}

export function extrairBarbeariaDoDestino(destino: string | null) {
    if (!destino) return null

    try {
        const url = new URL(destino, window.location.origin)
        return url.searchParams.get('barbearia')
    } catch (e) {
        return null
    }
}

export function normalizarDestinoInterno(destino: string | null) {
    if (!destino) return null

    try {
        const url = new URL(destino, window.location.origin)
        const caminho = `${url.pathname}${url.search}`

        if (!caminho.startsWith('/')) return null
        if (url.pathname === '/entrar') return null

        return caminho
    } catch (e) {
        return destino.startsWith('/') && !destino.startsWith('/entrar') ? destino : null
    }
}
