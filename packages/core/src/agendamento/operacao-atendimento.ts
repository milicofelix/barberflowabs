import { ROTULOS_STATUS_AGENDAMENTO, statusAgendamentoValido, type StatusAgendamento } from './status-atendimento'

export interface AtendimentoOperacional {
    id: number; status: string; data: string; dataFim?: string | null; valorTotal: number
    iniciadoEm?: string | null; finalizadoEm?: string | null; controleManualEm?: string | null
    controleManualPorId?: number | null; controleManualPor?: { id: number; nome: string } | null
    automacaoAtendimentoAtiva?: boolean; revisaoFluxo?: number
    usuario?: { id?: number; nome: string }; profissional?: { id: number; nome: string }
    servicos?: Array<{ id: number; nome: string }>
    estabelecimento?: { fluxoAtendimentoAutomaticoAtivo: boolean; fusoHorario: string; inicioAtendimentoAutomaticoAtivo?: boolean; finalizacaoAtendimentoAutomaticaAtiva?: boolean }
}
export type AcaoAtendimento = StatusAgendamento | 'RETOMAR_AUTOMACAO'
export const ROTULOS_ACOES: Partial<Record<AcaoAtendimento, string>> = {
    CONFIRMADO: 'Confirmar', ATRASADO: 'Marcar atraso', CHECKIN: 'Iniciar atendimento', CONCLUIDO: 'Finalizar',
    CANCELADO: 'Cancelar', NO_SHOW: 'Registrar ausência', RETOMAR_AUTOMACAO: 'Retomar automação',
}
export const rotuloStatus = (status: string) => statusAgendamentoValido(status) ? ROTULOS_STATUS_AGENDAMENTO[status] : status
export const atendimentoTerminal = (status: string) => ['CONCLUIDO', 'CANCELADO', 'NO_SHOW'].includes(status)
export function acoesAtendimento(item: AtendimentoOperacional, agora: number): AcaoAtendimento[] {
    if (!statusAgendamentoValido(item.status)) return []
    const acoes: AcaoAtendimento[] = []
    if (item.status === 'AGENDADO') acoes.push('CONFIRMADO')
    if (['AGENDADO', 'CONFIRMADO', 'CHECKIN'].includes(item.status)) acoes.push('ATRASADO')
    if (['AGENDADO', 'CONFIRMADO', 'ATRASADO'].includes(item.status)) acoes.push('CHECKIN')
    if (['ATRASADO', 'CHECKIN'].includes(item.status)) acoes.push('CONCLUIDO')
    if (!atendimentoTerminal(item.status)) {
        if (new Date(item.data).getTime() <= agora) acoes.push('NO_SHOW')
        acoes.push('CANCELADO')
        if (item.estabelecimento?.fluxoAtendimentoAutomaticoAtivo && (item.controleManualEm || !item.automacaoAtendimentoAtiva || item.status === 'ATRASADO')) acoes.push('RETOMAR_AUTOMACAO')
    }
    return acoes
}
export function comecaEmDezMinutos(item: AtendimentoOperacional, agora: number) {
    const faltam = new Date(item.data).getTime() - agora
    return ['AGENDADO', 'CONFIRMADO', 'ATRASADO'].includes(item.status) && faltam >= 0 && faltam <= 600_000
}
export function dataAtendimento(item: AtendimentoOperacional) {
    const partes = new Intl.DateTimeFormat('en-CA', { timeZone: item.estabelecimento?.fusoHorario ?? 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(item.data))
    const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value
    return `${parte('year')}-${parte('month')}-${parte('day')}`
}
export function horarioAtendimento(valor: string, item: AtendimentoOperacional) {
    return new Intl.DateTimeFormat('pt-BR', { timeZone: item.estabelecimento?.fusoHorario ?? 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor))
}

export function intervaloDiaAtendimento(data: string, fusoHorario: string) {
    const [ano, mes, dia] = data.split('-').map(Number)
    const converter = (diaUTC: number) => {
        const alvo = Date.UTC(ano, mes - 1, diaUTC)
        let instante = alvo
        for (let tentativa = 0; tentativa < 3; tentativa++) {
            const partes = new Intl.DateTimeFormat('en-US', { timeZone: fusoHorario, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(instante))
            const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value)
            const local = Date.UTC(valor('year'), valor('month') - 1, valor('day'), valor('hour'), valor('minute'), valor('second'))
            const diferenca = alvo - local
            instante += diferenca
            if (!diferenca) break
        }
        return new Date(instante).toISOString()
    }
    return { inicio: converter(dia), fim: converter(dia + 1) }
}
