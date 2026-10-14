import { capaPersonalizada, categoriaIdentidade, resolverURLMidia, type IdentidadeEstabelecimento } from '@uniflowabs/core'

export function capaDoEstabelecimento(unidade: IdentidadeEstabelecimento, ignorarPersonalizada = false) {
    const propria = ignorarPersonalizada ? null : capaPersonalizada(unidade)
    if (propria) return resolverURLMidia(propria, process.env.NEXT_PUBLIC_API_URL ?? '')
    const categoria = categoriaIdentidade(unidade)
    return categoria ? `/estabelecimentos/${categoria}-default.png` : '/banners/principal.png'
}
