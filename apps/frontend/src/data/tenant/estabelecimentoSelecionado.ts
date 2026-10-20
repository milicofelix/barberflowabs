'use client'

const CHAVE_STORAGE = 'barberflowabs_estabelecimento_slug'
export const EVENTO_ESTABELECIMENTO_SELECIONADO = 'barberflowabs:estabelecimento-selecionado'

export const ESTABELECIMENTO_PADRAO = process.env.NEXT_PUBLIC_ESTABELECIMENTO_SLUG ?? 'barber-flow-abs'

export function obterEstabelecimentoSelecionado() {
    if (typeof window === 'undefined') return ESTABELECIMENTO_PADRAO

    const slugUrl = new URLSearchParams(window.location.search).get('estabelecimento')
    if (slugUrl) {
        return slugUrl
    }

    return window.localStorage.getItem(CHAVE_STORAGE) || ESTABELECIMENTO_PADRAO
}

export function temEstabelecimentoSelecionado() {
    if (typeof window === 'undefined') return false

    const slugUrl = new URLSearchParams(window.location.search).get('estabelecimento')
    return Boolean(slugUrl || window.localStorage.getItem(CHAVE_STORAGE))
}

export function estaNoFluxoDeAgendamentoCliente() {
    if (typeof window === 'undefined') return false

    return window.location.pathname.startsWith('/agendamento')
}

export function salvarEstabelecimentoSelecionado(slug: string) {
    if (typeof window === 'undefined') return

    const slugLimpo = slug?.trim()
    if (!slugLimpo) return

    const slugAtual = window.localStorage.getItem(CHAVE_STORAGE)
    if (slugAtual === slugLimpo) return

    window.localStorage.setItem(CHAVE_STORAGE, slugLimpo)
    window.dispatchEvent(new CustomEvent(EVENTO_ESTABELECIMENTO_SELECIONADO, { detail: slugLimpo }))
}

export function extrairEstabelecimentoDoDestino(destino: string | null) {
    if (!destino) return null

    try {
        const url = new URL(destino, window.location.origin)
        return url.searchParams.get('estabelecimento')
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
