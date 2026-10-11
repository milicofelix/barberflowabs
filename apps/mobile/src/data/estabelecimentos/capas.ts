import type { ImageSourcePropType } from 'react-native'
import type { EstabelecimentoResumo } from './tipos'
import { visualDaCategoria } from './categorias-visuais'

const CAPA_PADRAO = require('@/assets/images/inicio/fundo.png')
const CAPA_BARBEARIA = require('@/assets/images/estabelecimentos/barbearia-default.png')
const CAPA_ESTETICA_BELEZA = require('@/assets/images/estabelecimentos/estetica-beleza-default.png')
const CAPA_CLINICA_ESTETICA = require('@/assets/images/estabelecimentos/clinica-estetica-default.png')
const CAPA_MANICURE_PEDICURE = require('@/assets/images/estabelecimentos/manicure-pedicure-default.png')
const CAPA_SALAO_CABELO = require('@/assets/images/estabelecimentos/salao-cabelo-default.png')
const CAPA_SPA_BEM_ESTAR = require('@/assets/images/estabelecimentos/spa-bem-estar-default.png')
const URL_BASE = process.env.API_URL?.replace(/\/$/, '')
const CAPAS_PROVISORIAS = ['/banner.png', '/banners/principal.png']
const CAPAS_POR_TIPO: Record<string, ImageSourcePropType> = {
    BARBEARIA: CAPA_BARBEARIA,
    SALAO_BELEZA: CAPA_SALAO_CABELO,
    CLINICA_ESTETICA: CAPA_CLINICA_ESTETICA,
    ESTUDIO_BELEZA: CAPA_ESTETICA_BELEZA,
    ESMALTERIA: CAPA_MANICURE_PEDICURE,
    SPA_BEM_ESTAR: CAPA_SPA_BEM_ESTAR,
}

export function capaDoEstabelecimento(estabelecimento: EstabelecimentoResumo): ImageSourcePropType {
    return capaRemota(estabelecimento) ?? capaPadraoDoEstabelecimento(estabelecimento)
}

export function miniaturaDoEstabelecimento(estabelecimento: EstabelecimentoResumo): ImageSourcePropType {
    const remota = capaRemota(estabelecimento)
    if (remota) return remota

    const segmentos = estabelecimento.segmentos?.map((segmento) => `${segmento.slug} ${segmento.nome}`).join(' ') ?? ''
    return visualDaCategoria(estabelecimento.tipoEstabelecimento ?? '', segmentos).imagem
}

function capaRemota(estabelecimento: EstabelecimentoResumo): ImageSourcePropType | null {
    const url = estabelecimento.imagemCapaURL?.trim()
    if (url && /^https?:\/\//i.test(url)) return { uri: url, cache: 'force-cache' }
    if (url?.startsWith('/') && URL_BASE && !CAPAS_PROVISORIAS.includes(url)) {
        return { uri: `${URL_BASE}${url}`, cache: 'force-cache' }
    }
    return null
}

function capaPadraoDoEstabelecimento(estabelecimento: EstabelecimentoResumo) {
    const capaPorTipo = estabelecimento.tipoEstabelecimento && CAPAS_POR_TIPO[estabelecimento.tipoEstabelecimento]
    if (capaPorTipo) return capaPorTipo

    const segmentos = normalizar(estabelecimento.segmentos
        ?.map((segmento) => `${segmento.slug} ${segmento.nome}`)
        .join(' ') ?? '')

    if (contem(segmentos, ['manicure', 'pedicure', 'unha', 'esmalteria'])) return CAPA_MANICURE_PEDICURE
    if (contem(segmentos, ['spa', 'bem-estar', 'massagem'])) return CAPA_SPA_BEM_ESTAR
    if (contem(segmentos, ['barbearia', 'barba'])) return CAPA_BARBEARIA
    if (contem(segmentos, ['clinica', 'procedimento-estetico'])) return CAPA_CLINICA_ESTETICA
    if (contem(segmentos, ['salao', 'cabeleireiro', 'cabelo'])) return CAPA_SALAO_CABELO
    if (contem(segmentos, ['estetica', 'beleza'])) return CAPA_ESTETICA_BELEZA

    return CAPA_PADRAO
}

const contem = (valor: string, termos: string[]) => termos.some((termo) => valor.includes(termo))

function normalizar(valor: string) {
    return valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
