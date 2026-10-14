import type { ImageSourcePropType } from 'react-native'
import { capaPersonalizada, categoriaIdentidade, type IdentidadeEstabelecimento } from '@uniflowabs/core'

const capas: Record<string, ImageSourcePropType> = {
    barbearia: require('@/assets/images/estabelecimentos/barbearia-default.png'),
    'salao-cabelo': require('@/assets/images/estabelecimentos/salao-cabelo-default.png'),
    'clinica-estetica': require('@/assets/images/estabelecimentos/clinica-estetica-default.png'),
    'estetica-beleza': require('@/assets/images/estabelecimentos/estetica-beleza-default.png'),
    'manicure-pedicure': require('@/assets/images/estabelecimentos/manicure-pedicure-default.png'),
    'spa-bem-estar': require('@/assets/images/estabelecimentos/spa-bem-estar-default.png'),
}
export function fundoDaHome(unidade?: IdentidadeEstabelecimento | null, ignorarPersonalizada = false): ImageSourcePropType | null {
    const propria = ignorarPersonalizada ? null : capaPersonalizada(unidade)
    if (propria) return { uri: propria.startsWith('/') ? `${process.env.API_URL?.replace(/\/$/, '')}${propria}` : propria, cache: 'force-cache' }
    const categoria = categoriaIdentidade(unidade)
    if (categoria === 'barbearia') return require('@/assets/images/inicio/fundo.png')
    return categoria ? capas[categoria] : null
}
export function capaDoEstabelecimento(unidade: IdentidadeEstabelecimento): ImageSourcePropType {
    const propria = capaPersonalizada(unidade)
    if (propria) return fundoDaHome(unidade)!
    return capas[categoriaIdentidade(unidade) ?? ''] ?? require('@/assets/images/brand/logo-light-background.png')
}
export const miniaturaDoEstabelecimento = capaDoEstabelecimento
