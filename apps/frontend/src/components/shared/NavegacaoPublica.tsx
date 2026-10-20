import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPinned } from 'lucide-react'
import AlternadorTema from './AlternadorTema'

interface NavegacaoPublicaProps {
    voltarPara: string
    voltarLabel: string
}

export default function NavegacaoPublica({ voltarPara, voltarLabel }: NavegacaoPublicaProps) {
    return (
        <nav className="navegacao-publica sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 text-zinc-100 shadow-lg backdrop-blur">
            <div className="container flex min-h-16 items-center justify-between gap-4 py-2">
                <Link href={voltarPara} className="inline-flex items-center gap-2 rounded px-2 py-2 text-sm font-bold hover:bg-zinc-800">
                    <ArrowLeft size={18} aria-hidden="true" />
                    <span>{voltarLabel}</span>
                </Link>
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/estabelecimentos" className="inline-flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-800">
                        <MapPinned size={18} aria-hidden="true" />
                        <span className="hidden sm:inline">Estabelecimentos</span>
                    </Link>
                    <Link href="/agendamento" className="inline-flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-800">
                        <CalendarDays size={18} aria-hidden="true" />
                        <span className="hidden sm:inline">Meus agendamentos</span>
                    </Link>
                    <AlternadorTema />
                </div>
            </div>
        </nav>
    )
}
