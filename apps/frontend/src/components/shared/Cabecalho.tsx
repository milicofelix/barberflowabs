'use client'
import Link from 'next/link'
import Logo from './Logo'
import useSessao from '@/data/hooks/useSessao'
import MenuUsuario from './MenuUsuario'

export default function Cabecalho() {
    const { usuario } = useSessao()
    return (
        <header className="flex items-center h-24 bg-black/60 self-stretch">
            <nav className="flex items-center justify-between container">
                <Logo />
                <div>{usuario ? <MenuUsuario /> : <Link href="/entrar">Entrar</Link>}</div>
            </nav>
        </header>
    )
}
