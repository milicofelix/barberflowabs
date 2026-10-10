'use client'

import useFinanceiro from '@/data/hooks/useFinanceiro'
import { useState } from 'react'
import { CardFinanceiro, moeda } from './ComponentesFinanceiro'
import { CaixaFinanceiro, ContasFinanceiras } from './SecoesContas'
import { ComissoesFinanceiras, RepassesFinanceiros } from './SecoesComissoes'
import { ConciliacaoAuditoria, ConfiguracoesFinanceiras } from './SecoesIntegracao'

type Aba = 'RESUMO' | 'CONTAS' | 'COMISSOES' | 'CAIXA' | 'REPASSES' | 'CONFIGURACOES' | 'CONCILIACAO'
const abas: Array<[Aba, string]> = [['RESUMO', 'Resumo'], ['CONTAS', 'Contas'], ['COMISSOES', 'Comissões'], ['CAIXA', 'Caixa'], ['REPASSES', 'Repasses'], ['CONFIGURACOES', 'Pagamentos'], ['CONCILIACAO', 'Conciliação']]

export default function PainelFinanceiro() {
    const financeiro = useFinanceiro()
    const [aba, setAba] = useState<Aba>('RESUMO')
    const totais = resumir(financeiro.resumo?.contas ?? [])

    return <div className="grid gap-6">
        <div className="flex flex-wrap gap-2">{abas.map(([id, nome]) => <button key={id} type="button" onClick={() => setAba(id)} className={aba === id ? 'button font-bold' : 'button-outline'}>{nome}</button>)}</div>
        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2"><label className="grid gap-1 text-sm text-muted-foreground">Início<input className="input" type="date" value={financeiro.inicio} onChange={(e) => financeiro.setInicio(e.target.value)} /></label><label className="grid gap-1 text-sm text-muted-foreground">Fim<input className="input" type="date" value={financeiro.fim} onChange={(e) => financeiro.setFim(e.target.value)} /></label></div>
        {financeiro.mensagem && <p className="rounded-lg border border-border bg-secondary p-3 text-sm text-secondary-foreground">{financeiro.mensagem}</p>}
        {financeiro.carregando ? <p className="text-muted-foreground">Carregando financeiro...</p> : <>
            {aba === 'RESUMO' && <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><CardFinanceiro titulo="Recebido" valor={moeda(totais.recebido)} /><CardFinanceiro titulo="A receber" valor={moeda(totais.receber)} /><CardFinanceiro titulo="Pago" valor={moeda(totais.pago)} /><CardFinanceiro titulo="Repasses pendentes" valor={moeda(financeiro.resumo?.repasses?._sum?.valorLiquido)} detalhe={`${financeiro.resumo?.repasses?._count ?? 0} repasse(s)`} /></section>}
            {aba === 'CONTAS' && <ContasFinanceiras financeiro={financeiro} />}
            {aba === 'COMISSOES' && <ComissoesFinanceiras financeiro={financeiro} />}
            {aba === 'CAIXA' && <CaixaFinanceiro financeiro={financeiro} />}
            {aba === 'REPASSES' && <RepassesFinanceiros financeiro={financeiro} />}
            {aba === 'CONFIGURACOES' && <ConfiguracoesFinanceiras financeiro={financeiro} />}
            {aba === 'CONCILIACAO' && <ConciliacaoAuditoria financeiro={financeiro} />}
        </>}
    </div>
}

function resumir(grupos: any[]) {
    const porTipo = (tipo: string, status: string, campo: string) => Number(grupos.find((item) => item.tipo === tipo && item.status === status)?._sum?.[campo] ?? 0)
    const emAberto = (tipo: string) => ['PENDENTE', 'PARCIAL'].reduce((total, status) => total + porTipo(tipo, status, 'valorOriginal') - porTipo(tipo, status, 'valorPago'), 0)
    return { recebido: porTipo('RECEBER', 'PAGO', 'valorPago'), receber: emAberto('RECEBER'), pago: porTipo('PAGAR', 'PAGO', 'valorPago') }
}
