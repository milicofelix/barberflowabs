'use client'

import type { ReactNode } from 'react'

export function CardFinanceiro({ titulo, valor, detalhe }: { titulo: string; valor: ReactNode; detalhe?: ReactNode }) {
    return <div className="rounded-xl border border-border bg-card p-5 shadow-sm"><span className="text-sm text-muted-foreground">{titulo}</span><strong className="mt-2 block text-2xl text-foreground">{valor}</strong>{detalhe && <small className="mt-2 block text-muted-foreground">{detalhe}</small>}</div>
}

export function CampoFinanceiro(props: { label: string; value: any; onChange: (valor: string) => void; type?: string; children?: ReactNode }) {
    return <label className="grid gap-2 text-sm text-muted-foreground">{props.label}{props.children ?? <input className="input" type={props.type ?? 'text'} value={props.value} onChange={(e) => props.onChange(e.target.value)} />}</label>
}

export function FormularioFinanceiro({ titulo, children, onSubmit }: { titulo: string; children: ReactNode; onSubmit: () => void }) {
    return <form className="grid gap-4 rounded-xl border border-border bg-card p-5" onSubmit={(e) => { e.preventDefault(); onSubmit() }}><h2 className="text-lg font-bold text-foreground">{titulo}</h2>{children}<button className="button font-bold" type="submit">Salvar</button></form>
}

export function ListaFinanceira({ titulo, children, vazio }: { titulo: string; children: ReactNode; vazio?: boolean }) {
    return <section className="rounded-xl border border-border bg-card p-5"><h2 className="text-lg font-bold text-foreground">{titulo}</h2><div className="mt-4 grid gap-3">{vazio ? <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p> : children}</div></section>
}

export function LinhaFinanceira({ titulo, detalhe, status, acao, textoAcao, acaoSecundaria, textoAcaoSecundaria }: { titulo: string; detalhe: string; status?: string; acao?: () => void; textoAcao?: string; acaoSecundaria?: () => void; textoAcaoSecundaria?: string }) {
    return <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-3"><div><strong className="text-foreground">{titulo}</strong><p className="text-sm text-muted-foreground">{detalhe}</p></div><div className="flex items-center gap-2">{status && <span className="rounded-full bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">{status}</span>}{acao && <button type="button" className="button-outline text-sm" onClick={acao}>{textoAcao}</button>}{acaoSecundaria && <button type="button" className="button-outline text-sm" onClick={acaoSecundaria}>{textoAcaoSecundaria}</button>}</div></div>
}

export const moeda = (valor: any) => Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const data = (valor: any) => valor ? new Date(valor).toLocaleDateString('pt-BR') : '-'
