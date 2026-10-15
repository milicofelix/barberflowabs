'use client'

import useSessao from '@/data/hooks/useSessao'
import AvatarUsuario from '@/components/midia/AvatarUsuario'
import { LogOut } from 'lucide-react'
import Link from 'next/link'

/** Os destinos ficam nos botões do banner; aqui permanecem conta e saída. */
export default function MenuUsuario() {
    const { usuario, encerrarSessao } = useSessao()
    if (!usuario) return null
    return <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link href="/configuracoes" aria-label={`Conta de ${usuario.nome}`} title={`${usuario.nome} — ${usuario.email}`} className="rounded-full transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-400">
            <AvatarUsuario nome={usuario.nome} fotoURL={usuario.fotoURL} />
        </Link>
        <button type="button" onClick={encerrarSessao} aria-label="Sair da conta" title="Sair da conta" className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-rose-200/70 bg-rose-600/90 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 sm:px-4">
            <LogOut size={18} aria-hidden="true" /><span className="hidden sm:inline">Sair</span>
        </button>
    </div>
}
