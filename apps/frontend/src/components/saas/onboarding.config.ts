export const TIPOS_ESTABELECIMENTO_ONBOARDING = [
    ['BARBEARIA', 'Barbearia'],
    ['SALAO_BELEZA', 'Salão de beleza'],
    ['ESMALTERIA', 'Esmalteria'],
    ['CLINICA_ESTETICA', 'Clínica de estética'],
    ['SPA_BEM_ESTAR', 'Spa e bem-estar'],
    ['ESTUDIO_BELEZA', 'Estúdio de beleza'],
    ['PROFISSIONAL_AUTONOMO', 'Profissional autônomo'],
    ['OUTRO', 'Outro'],
]

export const MODELOS_ATENDIMENTO_ONBOARDING = [
    ['PRESENCIAL', 'Presencial'],
    ['DOMICILIAR', 'Domiciliar'],
    ['HIBRIDO', 'Híbrido'],
]

export interface SegmentoOnboarding {
    id: number
    nome: string
    especialidades: Array<{ id: number; nome: string }>
}
