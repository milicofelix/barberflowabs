export interface EspecialidadeOnboarding { id: number; nome: string; slug?: string }
export interface SegmentoOnboarding { id: number; nome: string; slug?: string; especialidades: EspecialidadeOnboarding[] }
export interface PlanoOnboarding { slug: string; nome: string; descricao?: string; valorDoCiclo?: number; precoMensal?: number }

export interface SolicitacaoEstabelecimento {
    id: number; versao: number; status: string
    nomePublico: string | null; emailComercial: string | null; telefoneComercial: string | null
    tipoEstabelecimento: string | null; modeloAtendimento: string | null; planoSlug: string | null
    cep: string | null; logradouro: string | null; numero: string | null; complemento: string | null
    pontoReferencia: string | null; bairro: string | null; cidade: string | null; estado: string | null
    enviadoEm?: string | null; motivoRevisao?: string | null
    segmentos: Array<{ segmentoId: number; segmento: { id: number; nome: string } }>
    especialidades: Array<{ especialidadeId: number; especialidade: { id: number; nome: string } }>
}

export interface FormularioSolicitacao {
    nomePublico: string; emailComercial: string; telefoneComercial: string
    tipoEstabelecimento: string; modeloAtendimento: string; planoSlug: string
    cep: string; logradouro: string; numero: string; complemento: string; pontoReferencia: string
    bairro: string; cidade: string; estado: string; segmentoIds: number[]; especialidadeIds: number[]
}

export const FORMULARIO_VAZIO: FormularioSolicitacao = {
    nomePublico: '', emailComercial: '', telefoneComercial: '', tipoEstabelecimento: '', modeloAtendimento: 'PRESENCIAL',
    planoSlug: 'mensal', cep: '', logradouro: '', numero: '', complemento: '', pontoReferencia: '', bairro: '', cidade: '',
    estado: '', segmentoIds: [], especialidadeIds: [],
}

export const TIPOS_ESTABELECIMENTO = [
    { valor: 'BARBEARIA', texto: 'Barbearia', descricao: 'Cabelo e barba', icone: 'content-cut', termos: ['barbearia', 'barba'] },
    { valor: 'SALAO_BELEZA', texto: 'Salão de beleza', descricao: 'Cabelos e tratamentos', icone: 'auto-fix-high', termos: ['cabelo', 'beleza', 'salao'] },
    { valor: 'ESMALTERIA', texto: 'Manicure e pedicure', descricao: 'Unhas e cuidados', icone: 'back-hand', termos: ['unha', 'manicure', 'pedicure', 'esmalteria'] },
    { valor: 'CLINICA_ESTETICA', texto: 'Clínica de estética', descricao: 'Estética facial e corporal', icone: 'spa', termos: ['estetica', 'clinica'] },
    { valor: 'SPA_BEM_ESTAR', texto: 'Spa e bem-estar', descricao: 'Relaxamento e terapias', icone: 'self-improvement', termos: ['spa', 'bem-estar', 'massoterapia'] },
    { valor: 'ESTUDIO_BELEZA', texto: 'Estúdio de beleza', descricao: 'Serviços especializados', icone: 'storefront', termos: ['beleza', 'sobrancelha', 'maquiagem'] },
    { valor: 'PROFISSIONAL_AUTONOMO', texto: 'Profissional autônomo', descricao: 'Atendimento individual', icone: 'person', termos: [] },
    { valor: 'OUTRO', texto: 'Outro', descricao: 'Outro negócio de serviços', icone: 'business-center', termos: [] },
] as const

export const MODELOS_ATENDIMENTO = [['PRESENCIAL', 'Presencial'], ['DOMICILIAR', 'Domiciliar'], ['HIBRIDO', 'Híbrido']]
export const somenteDigitos = (valor: string) => valor.replace(/\D/g, '')
export const formatarCep = (valor: string) => somenteDigitos(valor).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')
export function formatarTelefone(valor: string) {
    const digitos = somenteDigitos(valor).slice(0, 11)
    if (digitos.length <= 10) return digitos.replace(/^(\d{2})(\d{0,4})(\d{0,4})$/, (_, ddd, parte1, parte2) => `(${ddd}) ${parte1}${parte2 ? `-${parte2}` : ''}`)
    return digitos.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

export function sugerirSegmentos(tipo: string, segmentos: SegmentoOnboarding[]) {
    const termos = TIPOS_ESTABELECIMENTO.find((item) => item.valor === tipo)?.termos ?? []
    return segmentos.filter((segmento) => termos.some((termo) => normalizar(`${segmento.nome} ${segmento.slug ?? ''}`).includes(normalizar(termo)))).map((segmento) => segmento.id)
}
const normalizar = (valor: string) => valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function mapearFormulario(solicitacao: SolicitacaoEstabelecimento): FormularioSolicitacao {
    return {
        ...FORMULARIO_VAZIO, nomePublico: solicitacao.nomePublico ?? '', emailComercial: solicitacao.emailComercial ?? '',
        telefoneComercial: solicitacao.telefoneComercial ?? '', tipoEstabelecimento: solicitacao.tipoEstabelecimento ?? '',
        modeloAtendimento: solicitacao.modeloAtendimento ?? 'PRESENCIAL', planoSlug: solicitacao.planoSlug ?? 'mensal',
        cep: solicitacao.cep ?? '', logradouro: solicitacao.logradouro ?? '', numero: solicitacao.numero ?? '',
        complemento: solicitacao.complemento ?? '', pontoReferencia: solicitacao.pontoReferencia ?? '',
        bairro: solicitacao.bairro ?? '', cidade: solicitacao.cidade ?? '', estado: solicitacao.estado ?? '',
        segmentoIds: solicitacao.segmentos.map((item) => item.segmentoId), especialidadeIds: solicitacao.especialidades.map((item) => item.especialidadeId),
    }
}
