const ARQUIVOS: Record<string, string> = {
    BARBEARIA: 'barbearia.png',
    SALAO_BELEZA: 'salao-beleza.png',
    ESMALTERIA: 'manicure-pedicure.png',
    CLINICA_ESTETICA: 'clinica-estetica.png',
    SPA_BEM_ESTAR: 'spa-bem-estar.png',
    ESTUDIO_BELEZA: 'beleza.png',
    PROFISSIONAL_AUTONOMO: 'beleza.png',
    OUTRO: 'beleza.png',
}

interface EstabelecimentoComClassificacao {
    tipoEstabelecimento?: string
    segmentos?: Array<{ slug?: string; nome?: string; principal?: boolean }>
}

export function caminhoMarcador(estabelecimento: EstabelecimentoComClassificacao, tamanho: 128 | 256 = 128) {
    return `/map-markers/${tamanho}/${arquivoMarcador(estabelecimento)}`
}

function arquivoMarcador(estabelecimento: EstabelecimentoComClassificacao) {
    const porTipo = estabelecimento?.tipoEstabelecimento ? ARQUIVOS[estabelecimento.tipoEstabelecimento] : undefined
    if (porTipo) return porTipo

    const segmentos = estabelecimento?.segmentos ?? []
    const principal = segmentos.find((item) => item.principal) ?? segmentos[0]
    const segmento = normalizar(principal?.slug ?? principal?.nome)

    if (contem(segmento, ['barbearia', 'barba'])) return ARQUIVOS.BARBEARIA
    if (contem(segmento, ['manicure', 'pedicure', 'unha', 'esmalteria'])) return ARQUIVOS.ESMALTERIA
    if (contem(segmento, ['clinica', 'estetica'])) return ARQUIVOS.CLINICA_ESTETICA
    if (contem(segmento, ['spa', 'bem-estar', 'massagem'])) return ARQUIVOS.SPA_BEM_ESTAR
    if (contem(segmento, ['salao', 'cabelo', 'cabeleireiro'])) return ARQUIVOS.SALAO_BELEZA
    return ARQUIVOS.OUTRO
}

const contem = (valor: string, termos: string[]) => termos.some((termo) => valor.includes(termo))
const normalizar = (valor?: string) => String(valor ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
