import { BriefcaseBusiness, Building2, Flower2, Hand, HeartPulse, Scissors, Sparkles, UserRound } from 'lucide-react'

export const TIPOS_ESTABELECIMENTO_ONBOARDING = [
    { valor: 'BARBEARIA', texto: 'Barbearia', descricao: 'Cabelo e barba', Icone: Scissors, termosSegmento: ['barbearia', 'barba'] },
    { valor: 'SALAO_BELEZA', texto: 'Salão de beleza', descricao: 'Cabelos e tratamentos', Icone: Sparkles, termosSegmento: ['cabelo', 'beleza', 'salao'] },
    { valor: 'ESMALTERIA', texto: 'Manicure e pedicure', descricao: 'Unhas e cuidados', Icone: Hand, termosSegmento: ['unha', 'manicure', 'pedicure', 'esmalteria'] },
    { valor: 'CLINICA_ESTETICA', texto: 'Clínica de estética', descricao: 'Estética facial e corporal', Icone: HeartPulse, termosSegmento: ['estetica', 'clinica'] },
    { valor: 'SPA_BEM_ESTAR', texto: 'Spa e bem-estar', descricao: 'Relaxamento e terapias', Icone: Flower2, termosSegmento: ['spa', 'bem-estar', 'massoterapia'] },
    { valor: 'ESTUDIO_BELEZA', texto: 'Estúdio de beleza', descricao: 'Serviços especializados', Icone: Building2, termosSegmento: ['beleza', 'sobrancelha', 'maquiagem'] },
    { valor: 'PROFISSIONAL_AUTONOMO', texto: 'Profissional autônomo', descricao: 'Atendimento individual', Icone: UserRound, termosSegmento: [] },
    { valor: 'OUTRO', texto: 'Outro', descricao: 'Outro negócio de serviços', Icone: BriefcaseBusiness, termosSegmento: [] },
]

export const MODELOS_ATENDIMENTO_ONBOARDING = [
    ['PRESENCIAL', 'Presencial'],
    ['DOMICILIAR', 'Domiciliar'],
    ['HIBRIDO', 'Híbrido'],
]

export interface EspecialidadeOnboarding { id: number; nome: string; slug?: string }
export interface SegmentoOnboarding {
    id: number
    nome: string
    slug?: string
    especialidades: EspecialidadeOnboarding[]
}

export function sugerirSegmentos(tipo: string, segmentos: SegmentoOnboarding[]) {
    const termos = TIPOS_ESTABELECIMENTO_ONBOARDING.find((item) => item.valor === tipo)?.termosSegmento ?? []
    if (!termos.length) return []
    return segmentos
        .filter((segmento) => termos.some((termo) => normalizar(`${segmento.nome} ${segmento.slug ?? ''}`).includes(normalizar(termo))))
        .map((segmento) => segmento.id)
}

function normalizar(valor: string) {
    return valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
