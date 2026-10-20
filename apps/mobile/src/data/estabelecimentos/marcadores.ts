import type { EstabelecimentoResumo } from './tipos'
import type { ImageSourcePropType } from 'react-native'

const MARCADORES: Record<string, ImageSourcePropType> = {
    BARBEARIA: require('@/assets/images/map-markers/128/barbearia.png'),
    SALAO_BELEZA: require('@/assets/images/map-markers/128/salao-beleza.png'),
    ESMALTERIA: require('@/assets/images/map-markers/128/manicure-pedicure.png'),
    CLINICA_ESTETICA: require('@/assets/images/map-markers/128/clinica-estetica.png'),
    SPA_BEM_ESTAR: require('@/assets/images/map-markers/128/spa-bem-estar.png'),
    ESTUDIO_BELEZA: require('@/assets/images/map-markers/128/beleza.png'),
    PROFISSIONAL_AUTONOMO: require('@/assets/images/map-markers/128/beleza.png'),
    OUTRO: require('@/assets/images/map-markers/128/beleza.png'),
}

export function marcadorDoEstabelecimento(item: EstabelecimentoResumo): ImageSourcePropType {
    const porTipo = item.tipoEstabelecimento && MARCADORES[item.tipoEstabelecimento]
    if (porTipo) return porTipo

    const segmento = normalizar(item.segmentos?.find((valor) => valor.principal)?.slug
        ?? item.segmentos?.[0]?.slug ?? item.segmentos?.[0]?.nome)

    if (contem(segmento, ['barbearia', 'barba'])) return MARCADORES.BARBEARIA
    if (contem(segmento, ['manicure', 'pedicure', 'unha', 'esmalteria'])) return MARCADORES.ESMALTERIA
    if (contem(segmento, ['clinica', 'estetica'])) return MARCADORES.CLINICA_ESTETICA
    if (contem(segmento, ['spa', 'bem-estar', 'massagem'])) return MARCADORES.SPA_BEM_ESTAR
    if (contem(segmento, ['salao', 'cabelo', 'cabeleireiro'])) return MARCADORES.SALAO_BELEZA
    return MARCADORES.OUTRO
}

const contem = (valor: string, termos: string[]) => termos.some((termo) => valor.includes(termo))
const normalizar = (valor?: string) => String(valor ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
