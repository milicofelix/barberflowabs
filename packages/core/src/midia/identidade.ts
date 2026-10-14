export interface IdentidadeEstabelecimento {
    imagemCapaURL?: string | null
    tipoEstabelecimento?: string | null
    segmentos?: Array<{ slug?: string; principal?: boolean; segmento?: { slug?: string } }>
}

const tipos: Record<string, string> = {
    BARBEARIA: 'barbearia', SALAO_BELEZA: 'salao-cabelo', CLINICA_ESTETICA: 'clinica-estetica',
    ESTUDIO_BELEZA: 'estetica-beleza', ESMALTERIA: 'manicure-pedicure', SPA_BEM_ESTAR: 'spa-bem-estar',
}
const segmentos: Record<string, string> = {
    barbearia: 'barbearia', 'salao-beleza': 'salao-cabelo', 'manicure-pedicure': 'manicure-pedicure',
    'clinica-estetica': 'clinica-estetica', beleza: 'estetica-beleza', 'spa-bem-estar': 'spa-bem-estar',
}

/** Sem heurística por nome: principal → tipo → único segmento reconhecido → neutro. */
export function categoriaIdentidade(unidade?: IdentidadeEstabelecimento | null): string | null {
    if (!unidade) return null
    const principal = unidade.segmentos?.find((s) => s.principal)
    if (principal) return segmentos[principal.slug ?? principal.segmento?.slug ?? ''] ?? null
    if (tipos[unidade.tipoEstabelecimento ?? '']) return tipos[unidade.tipoEstabelecimento!]
    const categorias = [...new Set(unidade.segmentos?.map((s) => segmentos[s.slug ?? s.segmento?.slug ?? '']).filter(Boolean))]
    return categorias.length === 1 ? categorias[0] : null
}

export function capaPersonalizada(unidade?: IdentidadeEstabelecimento | null): string | null {
    const url = unidade?.imagemCapaURL?.trim()
    if (!url || ['/banner.png', '/banners/principal.png'].includes(url)) return null
    return /^https?:\/\//i.test(url) || (url.startsWith('/') && !url.startsWith('//')) ? url : null
}

export function iniciaisUsuario(nome: string): string {
    return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => Array.from(p)[0]).join('').toUpperCase() || 'U'
}

export function resolverURLMidia(url: string, api: string): string {
    return url.startsWith('/midias/') ? `${api.replace(/\/$/, '')}${url}` : url
}
