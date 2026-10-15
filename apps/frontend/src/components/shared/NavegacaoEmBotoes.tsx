'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import useSessao from '@/data/hooks/useSessao'
import { itensMenu } from '@/data/navegacao/itensMenu'

export default function NavegacaoEmBotoes() {
    const { usuario, carregando } = useSessao()
    const caminho = usePathname() ?? '/'
    const itens = itensMenu(usuario)
    if (carregando || !itens.length) return null
    return <div className="container w-full py-4 sm:py-6">
        <nav aria-label="Navegação principal" className="flex gap-3 overflow-x-auto pb-2 lg:grid lg:overflow-visible lg:pb-0" style={{ gridTemplateColumns: `repeat(${itens.length}, minmax(0, 1fr))` }}>
            {itens.map((item) => {
                const ativo = item.href === '/' ? caminho === '/' : caminho === item.href || caminho.startsWith(`${item.href}/`)
                const Icone = item.icone
                return <Link key={item.href} href={item.href} aria-current={ativo ? 'page' : undefined}
                    className={`group flex min-h-[88px] min-w-[190px] shrink-0 items-center gap-3 rounded-2xl border px-4 py-4 shadow-lg backdrop-blur-md transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-400 lg:min-w-0 ${ativo ? 'border-violet-300/60 bg-gradient-to-br from-blue-600 to-violet-600 text-white' : 'border-white/60 bg-white/95 text-slate-900 hover:bg-white dark:border-slate-600/60 dark:bg-slate-900/95 dark:text-slate-100 dark:hover:bg-slate-800'}`}>
                    <Icone size={30} strokeWidth={1.6} aria-hidden="true" className={`shrink-0 ${ativo ? 'text-white' : 'text-violet-600 dark:text-violet-300'}`} />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{item.titulo}</span><span className={`mt-1 block text-xs leading-snug ${ativo ? 'text-white/85' : 'text-slate-500 dark:text-slate-300'}`}>{item.descricao}</span></span>
                    <ChevronRight size={18} aria-hidden="true" className="shrink-0 opacity-60 transition group-hover:translate-x-0.5" />
                </Link>
            })}
        </nav>
        <p className="mt-1 text-xs text-white drop-shadow-md lg:hidden">Deslize para ver todos os acessos.</p>
    </div>
}
