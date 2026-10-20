'use client'

import { FormularioRelacionamento, DadosRelacionamento, valoresFormularioRelacionamento } from '@uniflowabs/core'
import { useState } from 'react'
import useDialogoCentral from './useDialogoCentral'

export interface EdicaoRelacionamento { form: FormularioRelacionamento; registro?: DadosRelacionamento; canal?: string }
export default function FormularioCentral({ edicao, ocupado, erro, fechar, salvar }: {
    edicao: EdicaoRelacionamento; ocupado: boolean; erro: string; fechar: () => void
    salvar: (valores: Record<string, string>) => Promise<boolean>
}) {
    const [valores, setValores] = useState(() => valoresFormularioRelacionamento(edicao.form, edicao.registro))
    const [confirmado, setConfirmado] = useState(false)
    const dialogo = useDialogoCentral(fechar, ocupado)
    const campo = 'w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white'
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4" role="presentation">
        <section ref={dialogo} data-dialogo-central role="dialog" aria-modal="true" aria-labelledby="titulo-form-relacionamento" className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-xl dark:bg-slate-800 dark:text-white">
            <header className="flex items-center justify-between border-b border-slate-300 p-4 dark:border-slate-600"><h2 id="titulo-form-relacionamento" className="text-xl font-bold">{edicao.form.titulo}</h2><button autoFocus type="button" disabled={ocupado} onClick={fechar} className="rounded border px-4 py-2">Fechar</button></header>
            <form className="flex flex-col gap-4 overflow-y-auto p-5" onSubmit={async evento => { evento.preventDefault(); if (await salvar(valores)) fechar() }}>
                {edicao.form.aviso ? <p className="rounded-lg bg-amber-100 p-3 text-amber-950">{edicao.form.aviso}</p> : null}
                {edicao.form.campos.filter(c => !c.oculto).map(c => <label key={c.chave} className="flex flex-col gap-2 text-sm font-semibold">{c.titulo}
                    {c.tipo === 'booleano' ? <select className={campo} disabled={ocupado} value={valores[c.chave]} onChange={e => setValores(v => ({ ...v, [c.chave]: e.target.value }))}><option value="false">Não</option><option value="true">Sim</option></select>
                        : c.opcoes ? <select className={campo} disabled={ocupado} required={!c.opcional} value={valores[c.chave]} onChange={e => setValores(v => ({ ...v, [c.chave]: e.target.value }))}><option value="">Selecione</option>{c.opcoes.map(o => <option key={o.valor} value={o.valor}>{o.titulo}</option>)}</select>
                        : c.tipo === 'longo' || c.tipo === 'niveis' ? <textarea className={campo} disabled={ocupado} rows={4} required={!c.opcional} value={valores[c.chave]} onChange={e => setValores(v => ({ ...v, [c.chave]: e.target.value }))} />
                        : <input className={campo} disabled={ocupado} required={!c.opcional} type={c.tipo === 'numero' ? 'number' : c.tipo === 'data' ? 'datetime-local' : 'text'} min={c.tipo === 'numero' ? 0 : undefined} step={c.tipo === 'numero' ? 1 : undefined} value={valores[c.chave]} onChange={e => setValores(v => ({ ...v, [c.chave]: e.target.value }))} />}
                </label>)}
                {edicao.form.confirmar ? <label className="flex gap-3 text-sm"><input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)} required />{edicao.form.confirmar}</label> : null}
                {erro ? <p role="alert" className="rounded bg-red-100 p-3 text-red-900">{erro}</p> : null}
                <button disabled={ocupado || (!!edicao.form.confirmar && !confirmado)} className="min-h-12 rounded-lg bg-violet-600 px-4 py-3 font-bold text-white disabled:opacity-50">{ocupado ? 'Salvando…' : 'Salvar'}</button>
            </form>
        </section>
    </div>
}
