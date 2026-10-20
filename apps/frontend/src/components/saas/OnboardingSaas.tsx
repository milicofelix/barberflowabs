'use client'

import { ArrowRight, Store } from 'lucide-react'
import Link from 'next/link'
import useSessao from '@/data/hooks/useSessao'
import AlternadorTema from '../shared/AlternadorTema'
import Logo from '../shared/Logo'
import PassosSolicitacaoEstabelecimento from './PassosSolicitacaoEstabelecimento'

export default function OnboardingSaas() {
    const { usuario, carregando } = useSessao()
    return <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card/90 backdrop-blur">
            <nav className="container flex min-h-24 items-center justify-between gap-4 py-4"><Logo /><AlternadorTema /></nav>
        </header>
        <main className="container py-10 sm:py-14">
            <header className="mx-auto mb-9 max-w-3xl text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200"><Store size={17} />Cadastro de estabelecimento</span>
                <h1 className="mt-4 text-3xl font-black sm:text-5xl">Leve seu negócio para a UniFlow ABS</h1>
                <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Preencha as informações em poucos passos. Nossa equipe validará o endereço e a classificação antes de publicar o perfil.</p>
            </header>
            {carregando ? <p className="text-center text-muted-foreground">Carregando sua conta...</p>
                : usuario ? <div className="mx-auto max-w-5xl"><PassosSolicitacaoEstabelecimento /></div>
                    : <EntradaAutenticacao />}
        </main>
    </div>
}

function EntradaAutenticacao() {
    return <section className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-7 text-center shadow-xl sm:p-10">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-violet-600 text-white"><Store size={30} /></div>
        <h2 className="mt-5 text-2xl font-black">Primeiro, acesse sua conta</h2>
        <p className="mt-2 text-muted-foreground">Toda pessoa começa como cliente da plataforma. Depois do acesso, esta página será retomada para você cadastrar seu estabelecimento sem duplicar seus dados.</p>
        <Link href="/entrar?destino=/onboarding" className="button mt-6 inline-flex items-center gap-2">Entrar ou criar conta <ArrowRight size={18} /></Link>
        <p className="mt-4 text-xs text-muted-foreground">Seu acesso operacional somente será liberado após a aprovação.</p>
    </section>
}
