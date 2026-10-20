import type { GrupoResumoConta, ResumoFinanceiro, TipoConta, ValorMonetario } from './tipos'

export function moeda(valor: ValorMonetario | null | undefined) {
    return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function dataHora(valor: string | null | undefined) {
    return valor ? new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'
}

export function data(valor: string | null | undefined) {
    if (!valor) return '-'
    const [ano, mes, dia] = valor.slice(0, 10).split('-')
    return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor
}

export function totaisDoResumo(resumo: ResumoFinanceiro | null) {
    const grupos = resumo?.contas ?? []
    return {
        recebido: valorDoGrupo(grupos, 'RECEBER', 'PAGO', 'valorPago'),
        aReceber: saldoEmAberto(grupos, 'RECEBER'),
        pago: valorDoGrupo(grupos, 'PAGAR', 'PAGO', 'valorPago'),
        aPagar: saldoEmAberto(grupos, 'PAGAR'),
        repassesPendentes: Number(resumo?.repasses?._sum?.valorLiquido ?? 0),
        quantidadeRepasses: Number(resumo?.repasses?._count ?? 0),
        divergenciaConciliacao: Number(resumo?.conciliacoes?._sum?.diferenca ?? 0),
        quantidadeDivergencias: Number(resumo?.conciliacoes?._count ?? 0),
    }
}

export function periodoHoje() {
    const data = formatarData(new Date())
    return { inicio: data, fim: data }
}

export function periodoSemana() {
    const fim = new Date()
    const inicio = new Date(fim)
    const dia = inicio.getDay()
    inicio.setDate(inicio.getDate() - (dia === 0 ? 6 : dia - 1))
    return { inicio: formatarData(inicio), fim: formatarData(fim) }
}

export function periodoMes() {
    const fim = new Date()
    const inicio = new Date(fim.getFullYear(), fim.getMonth(), 1)
    return { inicio: formatarData(inicio), fim: formatarData(fim) }
}

function saldoEmAberto(grupos: GrupoResumoConta[], tipo: TipoConta) {
    return ['PENDENTE', 'PARCIAL'].reduce((total, status) =>
        total + valorDoGrupo(grupos, tipo, status, 'valorOriginal') - valorDoGrupo(grupos, tipo, status, 'valorPago'), 0)
}

function valorDoGrupo(grupos: GrupoResumoConta[], tipo: TipoConta, status: string, campo: 'valorOriginal' | 'valorPago') {
    return Number(grupos.find((item) => item.tipo === tipo && item.status === status)?._sum?.[campo] ?? 0)
}

function formatarData(data: Date) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
}
