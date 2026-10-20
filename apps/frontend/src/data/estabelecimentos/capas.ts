import { capaPersonalizada, categoriaIdentidade, resolverURLMidia, type IdentidadeEstabelecimento } from '@uniflowabs/core'

export function fundoDaPlataforma(tema: 'light' | 'dark') {
    return tema === 'light' ? '/banners/principal-dia.png' : '/banners/principal.png'
}

export function capaDoEstabelecimento(unidade: IdentidadeEstabelecimento, ignorarPersonalizada = false, tema: 'light' | 'dark' = 'dark') {
    const propria = ignorarPersonalizada ? null : capaPersonalizada(unidade)
    if (propria) return resolverURLMidia(propria, process.env.NEXT_PUBLIC_API_URL ?? '')
    const categoria = categoriaIdentidade(unidade)
    return categoria ? `/estabelecimentos/${categoria}-default.png` : fundoDaPlataforma(tema)
}
