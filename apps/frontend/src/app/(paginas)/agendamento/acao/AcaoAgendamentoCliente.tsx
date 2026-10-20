'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL

export default function AcaoAgendamentoCliente() {
    const token = useSearchParams().get('token') ?? ''
    const [dados, setDados] = useState<any>(null)
    const [erro, setErro] = useState('')
    const [processando, setProcessando] = useState(false)

    useEffect(() => {
        if (!token) { setErro('Link de agendamento incompleto.'); return }
        fetch(`${API}/acoes-agendamento/${encodeURIComponent(token)}`).then(async (resposta) => {
            const corpo = await resposta.json()
            if (!resposta.ok) throw new Error(corpo?.message ?? 'Link inválido ou expirado')
            setDados(corpo)
        }).catch((e) => setErro(e.message))
    }, [token])

    async function executar(acao: 'confirmar' | 'cancelar') {
        setProcessando(true); setErro('')
        try {
            const resposta = await fetch(`${API}/acoes-agendamento/${encodeURIComponent(token)}/${acao}`, { method: 'POST' })
            const corpo = await resposta.json()
            if (!resposta.ok) throw new Error(corpo?.message ?? 'Não foi possível concluir a ação')
            setDados(corpo)
        } catch (e: any) { setErro(e.message) } finally { setProcessando(false) }
    }

    return <main className="grid min-h-screen place-items-center bg-slate-50 p-5 text-slate-950">
        <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
            <p className="text-sm font-black uppercase tracking-[.18em] text-violet-600">UniFlow ABS</p>
            <h1 className="mt-3 text-3xl font-black">Gerenciar agendamento</h1>
            {erro ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{erro}</p> : null}
            {!dados && !erro ? <p className="mt-5 text-slate-600">Consultando os dados com segurança...</p> : null}
            {dados ? <div className="mt-6 grid gap-3">
                <p><strong>{dados.estabelecimento}</strong></p>
                <p className="text-slate-600">{dados.servicos.join(', ')} com {dados.profissional}</p>
                <p className="text-slate-600">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short', timeZone: dados.fusoHorario }).format(new Date(dados.data))}</p>
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold">Status: {dados.status}</p>
                {dados.acao === 'CONFIRMAR' && dados.status === 'AGENDADO' ? <button disabled={processando} onClick={() => executar('confirmar')} className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white disabled:opacity-50">Confirmar horário</button> : null}
                {dados.acao === 'CANCELAR' && ['AGENDADO', 'CONFIRMADO'].includes(dados.status) ? <button disabled={processando} onClick={() => executar('cancelar')} className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50">Cancelar agendamento</button> : null}
                {dados.acao === 'REAGENDAR' ? <Link href="/entrar" className="rounded-xl bg-violet-600 px-5 py-3 text-center font-bold text-white">Entrar para reagendar</Link> : null}
            </div> : null}
        </section>
    </main>
}
