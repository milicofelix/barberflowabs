'use client'
import Link from 'next/link'
import Logo from './Logo'
import useSessao from '@/data/hooks/useSessao'
import MenuUsuario from './MenuUsuario'
import AlternadorTema from './AlternadorTema'
import CentralNotificacoes from './CentralNotificacoes'

interface CabecalhoProps {
    semFundo?: boolean
}

export default function Cabecalho({ semFundo = false }: CabecalhoProps) {
    const { usuario } = useSessao()
    return (
        <header className={`cabecalho-hero flex min-h-36 shrink-0 items-start self-stretch text-white ${semFundo ? 'cabecalho-home' : 'bg-black/45'}`}>
            <nav aria-label="Conta e preferências" className="container flex flex-wrap items-start justify-between gap-4 pb-6 pt-8">
                <Logo />
                <div className="ml-auto">
                    {usuario ? (
                        <div className="flex items-center gap-2 sm:gap-3"><CentralNotificacoes /><AlternadorTema /><MenuUsuario /></div>
                    ) : (
                        <div className="flex items-center gap-5">
                            <Link href="/estabelecimentos">Estabelecimentos</Link>
                            <Link href="/onboarding" className="font-semibold text-yellow-400">
                                Criar estabelecimento
                            </Link>
                            <Link href="/entrar">Entrar</Link>
                            <AlternadorTema />
                        </div>
                    )}
                </div>
            </nav>
        </header>
    )
}
