'use client'
import Link from 'next/link'
import Logo from './Logo'
import useSessao from '@/data/hooks/useSessao'
import MenuUsuario from './MenuUsuario'
import AlternadorTema from './AlternadorTema'

interface CabecalhoProps {
    semFundo?: boolean
}

export default function Cabecalho({ semFundo = false }: CabecalhoProps) {
    const { usuario } = useSessao()
    return (
        <header className={`cabecalho-hero flex h-36 items-start self-stretch text-white ${semFundo ? 'cabecalho-home' : 'bg-black/45'}`}>
            <nav className="container flex items-start justify-between pt-8">
                <Logo />
                <div>
                    {usuario ? (
                        <div className="flex items-center gap-3"><MenuUsuario /><AlternadorTema /></div>
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
