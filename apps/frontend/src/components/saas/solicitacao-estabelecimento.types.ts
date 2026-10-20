import type { SegmentoOnboarding } from './onboarding.config'

export interface SolicitacaoEstabelecimento {
    id: number
    versao: number
    status: string
    nomePublico: string | null
    emailComercial: string | null
    telefoneComercial: string | null
    tipoEstabelecimento: string | null
    modeloAtendimento: string | null
    planoSlug: string | null
    cep: string | null
    logradouro: string | null
    numero: string | null
    complemento: string | null
    pontoReferencia: string | null
    bairro: string | null
    cidade: string | null
    estado: string | null
    enviadoEm?: string | null
    motivoRevisao?: string | null
    segmentos: Array<{ segmentoId: number; segmento: { id: number; nome: string } }>
    especialidades: Array<{ especialidadeId: number; especialidade: { id: number; nome: string } }>
}

export interface ConfiguracaoSolicitacao {
    termosVersao: string
    tiposEstabelecimento: string[]
    modelosAtendimento: string[]
}

export interface DadosOnboarding {
    solicitacao: SolicitacaoEstabelecimento
    configuracao: ConfiguracaoSolicitacao
    segmentos: SegmentoOnboarding[]
    planos: Array<{ slug: string; nome: string; descricao?: string; valorDoCiclo?: number; precoMensal?: number }>
}

export function somenteDigitos(valor: string) { return valor.replace(/\D/g, '') }

export function formatarCep(valor: string) {
    const digitos = somenteDigitos(valor).slice(0, 8)
    return digitos.replace(/^(\d{5})(\d)/, '$1-$2')
}

export function formatarTelefone(valor: string) {
    const digitos = somenteDigitos(valor).slice(0, 11)
    if (digitos.length <= 10) return digitos.replace(/^(\d{2})(\d{0,4})(\d{0,4})$/, (_, ddd, parte1, parte2) =>
        `(${ddd}${ddd.length === 2 ? ') ' : ''}${parte1}${parte2 ? `-${parte2}` : ''}`)
    return digitos.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

export const STATUS_SOLICITACAO_LABEL: Record<string, string> = {
    RASCUNHO: 'Rascunho', PENDING_REVIEW: 'Em análise', APPROVED: 'Aprovada', REJECTED: 'Reprovada',
    CORRECTION_REQUESTED: 'Correção solicitada', CANCELED: 'Cancelada',
}
