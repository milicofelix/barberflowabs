import type { ImageSourcePropType } from 'react-native'

const URL_BASE = process.env.API_URL?.replace(/\/$/, '')
const PROFISSIONAL_PADRAO = require('@/assets/images/avatar.png')
const SERVICO_PADRAO = require('@/assets/images/servicos/corte-de-cabelo.jpg')

const PROFISSIONAIS_POR_ARQUIVO: Record<string, ImageSourcePropType> = {
    'profissional-1.jpg': require('@/assets/images/profissionais/profissional-1.jpg'),
    'profissional-2.jpg': require('@/assets/images/profissionais/profissional-2.jpg'),
    'profissional-3.jpg': require('@/assets/images/profissionais/profissional-3.jpg'),
    'profissional-4.jpg': require('@/assets/images/profissionais/profissional-4.jpg'),
    'profissional-5.jpg': require('@/assets/images/profissionais/profissional-5.jpg'),
    'profissional-6.jpg': require('@/assets/images/profissionais/profissional-6.jpg'),
}

const SERVICOS_POR_ARQUIVO: Record<string, ImageSourcePropType> = {
    'corte-de-cabelo.jpg': require('@/assets/images/servicos/corte-de-cabelo.jpg'),
    'corte-de-barba.jpg': require('@/assets/images/servicos/corte-de-barba.jpg'),
    'manicure-pedicure.jpg': require('@/assets/images/servicos/manicure-pedicure.jpg'),
    'combo.jpg': require('@/assets/images/servicos/combo.jpg'),
    'corte-infantil.jpg': require('@/assets/images/servicos/corte-infantil.jpg'),
    'dia-de-noivo.jpg': require('@/assets/images/servicos/dia-de-noivo.jpg'),
}

export function imagemDoProfissional(imagemURL?: string | null): ImageSourcePropType {
    return resolverImagem(imagemURL, PROFISSIONAIS_POR_ARQUIVO, PROFISSIONAL_PADRAO)!
}

export function imagemDoServico(nome: string, imagemURL?: string | null): ImageSourcePropType {
    const imagemCadastrada = resolverImagem(imagemURL, SERVICOS_POR_ARQUIVO)
    if (imagemCadastrada) return imagemCadastrada

    const nomeNormalizado = normalizar(nome)
    if (contem(nomeNormalizado, ['infantil', 'crianca', 'principe'])) {
        return SERVICOS_POR_ARQUIVO['corte-infantil.jpg']
    }
    if (contem(nomeNormalizado, ['combo', 'corte e barba', 'cabelo e barba'])) {
        return SERVICOS_POR_ARQUIVO['combo.jpg']
    }
    if (contem(nomeNormalizado, ['barba', 'lenhador'])) {
        return SERVICOS_POR_ARQUIVO['corte-de-barba.jpg']
    }
    if (contem(nomeNormalizado, ['manicure', 'pedicure', 'unha'])) {
        return SERVICOS_POR_ARQUIVO['manicure-pedicure.jpg']
    }
    if (contem(nomeNormalizado, ['noivo'])) {
        return SERVICOS_POR_ARQUIVO['dia-de-noivo.jpg']
    }

    return SERVICO_PADRAO
}

function resolverImagem(
    imagemURL: string | null | undefined,
    imagensLocais: Record<string, ImageSourcePropType>,
    imagemPadrao?: ImageSourcePropType
): ImageSourcePropType | undefined {
    const url = imagemURL?.trim()
    if (!url) return imagemPadrao

    const arquivo = url.split(/[?#]/)[0].split('/').pop()?.toLowerCase()
    if (arquivo && imagensLocais[arquivo]) return imagensLocais[arquivo]
    if (/^https?:\/\//i.test(url)) return { uri: url }
    if (url.startsWith('/') && URL_BASE) return { uri: `${URL_BASE}${url}` }

    return imagemPadrao
}

function normalizar(valor: string) {
    return valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const contem = (valor: string, termos: string[]) => termos.some((termo) => valor.includes(termo))
