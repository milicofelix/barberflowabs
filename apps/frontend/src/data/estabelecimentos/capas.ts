interface SegmentoDaCapa {
    slug?: string
    nome?: string
}

interface EstabelecimentoDaCapa {
    imagemCapaURL?: string | null
    tipoEstabelecimento?: string | null
    segmentos?: SegmentoDaCapa[]
}

const CAPA_PADRAO = '/banners/principal.png'
const CAPAS_PROVISORIAS = ['/banner.png', '/banners/principal.png']
const CAPAS_POR_TIPO: Record<string, string> = {
    BARBEARIA: '/estabelecimentos/barbearia-default.png',
    SALAO_BELEZA: '/estabelecimentos/salao-cabelo-default.png',
    CLINICA_ESTETICA: '/estabelecimentos/clinica-estetica-default.png',
    ESTUDIO_BELEZA: '/estabelecimentos/estetica-beleza-default.png',
    ESMALTERIA: '/estabelecimentos/manicure-pedicure-default.png',
    SPA_BEM_ESTAR: '/estabelecimentos/spa-bem-estar-default.png',
}

export function capaDoEstabelecimento(estabelecimento: EstabelecimentoDaCapa) {
    const url = estabelecimento.imagemCapaURL?.trim()
    if (url && !CAPAS_PROVISORIAS.includes(url)) return url

    const capaPorTipo = estabelecimento.tipoEstabelecimento && CAPAS_POR_TIPO[estabelecimento.tipoEstabelecimento]
    if (capaPorTipo) return capaPorTipo

    const segmentos = normalizar(estabelecimento.segmentos
        ?.map((segmento) => `${segmento.slug ?? ''} ${segmento.nome ?? ''}`)
        .join(' ') ?? '')

    if (contem(segmentos, ['manicure', 'pedicure', 'unha', 'esmalteria'])) return CAPAS_POR_TIPO.ESMALTERIA
    if (contem(segmentos, ['spa', 'bem-estar', 'massagem'])) return CAPAS_POR_TIPO.SPA_BEM_ESTAR
    if (contem(segmentos, ['barbearia', 'barba'])) return CAPAS_POR_TIPO.BARBEARIA
    if (contem(segmentos, ['clinica', 'procedimento-estetico'])) return CAPAS_POR_TIPO.CLINICA_ESTETICA
    if (contem(segmentos, ['salao', 'cabeleireiro', 'cabelo'])) return CAPAS_POR_TIPO.SALAO_BELEZA
    if (contem(segmentos, ['estetica', 'beleza'])) return CAPAS_POR_TIPO.ESTUDIO_BELEZA

    return CAPA_PADRAO
}

const contem = (valor: string, termos: string[]) => termos.some((termo) => valor.includes(termo))
const normalizar = (valor: string) => valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
