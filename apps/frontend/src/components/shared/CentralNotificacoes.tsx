'use client'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import useNotificacoes from '@/data/hooks/useNotificacoes'

export default function CentralNotificacoes() {
    const [aberta, setAberta] = useState(false)
    const { itens, naoLidas, carregar, ler, lerTodas } = useNotificacoes()
    return <div className="relative">
        <button aria-label="Notificações" onClick={() => { const proximoEstado = !aberta; setAberta(proximoEstado); if (proximoEstado) carregar() }} className="relative rounded-full border border-white/25 bg-black/25 p-2.5 text-white">
            <Bell size={20} />{naoLidas ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-fuchsia-500 px-1 text-xs font-bold">{naoLidas}</span> : null}
        </button>
        {aberta ? <div className="absolute right-0 z-50 mt-2 w-[min(90vw,380px)] rounded-2xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <div className="mb-2 flex items-center justify-between"><strong>Notificações</strong><button onClick={lerTodas} className="text-xs text-indigo-500">Marcar todas como lidas</button></div>
            <div className="max-h-96 space-y-2 overflow-auto">{itens.length ? itens.map((item) => <Link key={item.id} href={destino(item.acaoUrl)} onClick={() => { ler(item.id); setAberta(false) }} className={`block rounded-xl p-3 ${item.lidaEm ? 'bg-slate-50 dark:bg-slate-800/50' : 'bg-indigo-50 dark:bg-indigo-950/60'}`}>
                <div className="font-semibold">{item.titulo}</div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.mensagem}</p>
            </Link>) : <p className="p-4 text-center text-sm text-slate-500">Nenhuma notificação.</p>}</div>
        </div> : null}
    </div>
}
function destino(url?: string | null) { return url?.startsWith('/admin/') ? '/admin' : (url || '/onboarding') }
