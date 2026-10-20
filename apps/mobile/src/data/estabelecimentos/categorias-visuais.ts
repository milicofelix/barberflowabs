import type { ImageSourcePropType } from 'react-native'

export interface CategoriaVisual {
    imagem: ImageSourcePropType
    icone: string
}

const VISUAIS = {
    todos: { imagem: require('@/assets/images/categorias/todos.png'), icone: 'grid-outline' },
    barbearia: { imagem: require('@/assets/images/categorias/barbearia.png'), icone: 'cut-outline' },
    beleza: { imagem: require('@/assets/images/categorias/beleza.png'), icone: 'color-palette-outline' },
    manicure: { imagem: require('@/assets/images/categorias/manicure-pedicure.png'), icone: 'hand-left-outline' },
    spa: { imagem: require('@/assets/images/categorias/spa-bem-estar.png'), icone: 'leaf-outline' },
    salao: { imagem: require('@/assets/images/categorias/salao-cabelo.png'), icone: 'brush-outline' },
    clinica: { imagem: require('@/assets/images/categorias/clinica-estetica.png'), icone: 'medkit-outline' },
} satisfies Record<string, CategoriaVisual>

export function visualDaCategoria(slug = '', nome = ''): CategoriaVisual {
    const categoria = normalizar(`${slug} ${nome}`)
    if (!categoria.trim()) return VISUAIS.todos
    if (contem(categoria, ['barbearia', 'barba'])) return VISUAIS.barbearia
    if (contem(categoria, ['manicure', 'pedicure', 'unha', 'esmalteria'])) return VISUAIS.manicure
    if (contem(categoria, ['spa', 'massagem', 'massoterapia', 'bem-estar'])) return VISUAIS.spa
    if (contem(categoria, ['clinica'])) return VISUAIS.clinica
    if (contem(categoria, ['salao', 'cabelo', 'cabeleireiro'])) return VISUAIS.salao
    if (contem(categoria, ['beleza', 'estetica'])) return VISUAIS.beleza
    return VISUAIS.todos
}

export function tituloDaCategoria(slug = '', nome = '') {
    const categoria = normalizar(`${slug} ${nome}`)
    if (!categoria.trim()) return 'Serviços perto de você'
    if (contem(categoria, ['barbearia', 'barba'])) return 'Barbearias perto de você'
    if (contem(categoria, ['manicure', 'pedicure', 'unha', 'esmalteria'])) return 'Manicure e pedicure perto de você'
    if (contem(categoria, ['spa', 'massagem', 'massoterapia', 'bem-estar'])) return 'Spas e massoterapia perto de você'
    if (contem(categoria, ['clinica'])) return 'Clínicas de estética perto de você'
    if (contem(categoria, ['salao', 'cabelo', 'cabeleireiro'])) return 'Salões de cabelo perto de você'
    if (contem(categoria, ['beleza', 'estetica'])) return 'Beleza e estética perto de você'
    return `${nome || 'Serviços'} perto de você`
}

const contem = (valor: string, termos: string[]) => termos.some((termo) => valor.includes(termo))
const normalizar = (valor: string) => valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
