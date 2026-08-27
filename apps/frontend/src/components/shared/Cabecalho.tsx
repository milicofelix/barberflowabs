'use client'
import Link from 'next/link'
import Logo from './Logo'
import useSessao from '@/data/hooks/useSessao'
import MenuUsuario from './MenuUsuario'

export default function Cabecalho() {
    const { usuario } = useSessao()
    return (
        <header className="flex h-36 items-start self-stretch bg-black/45">
            <nav className="container flex items-start justify-between pt-8">
                <Logo />
                <div>
                    {usuario ? (
                        <MenuUsuario />
                    ) : (
                        <div className="flex items-center gap-5">
                            <Link href="/barbearias">Barbearias</Link>
                            <Link href="/onboarding" className="font-semibold text-yellow-400">
                                Criar barbearia
                            </Link>
                            <Link href="/entrar">Entrar</Link>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    )
}
