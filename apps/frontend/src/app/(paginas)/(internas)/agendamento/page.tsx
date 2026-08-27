'use client'

import FormularioAgendamento from '@/components/agendamento/FormularioAgendamento'
import HistoricoAvaliacoes from '@/components/agendamento/HistoricoAvaliacoes'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'
import useSessao from '@/data/hooks/useSessao'
import { temBarbeariaSelecionada } from '@/data/tenant/barbeariaSelecionada'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Page() {
    const { usuario } = useSessao()
    const [barbeariaEscolhida, setBarbeariaEscolhida] = useState(true)
    const superAdmin = usuario?.role === 'SUPER_ADMIN' || usuario?.papel === 'SUPER_ADMIN'
    const cliente = !!usuario?.email && !usuario?.barbeiro && !superAdmin

    useEffect(() => {
        setBarbeariaEscolhida(temBarbeariaSelecionada())
    }, [])

    if (superAdmin) {
        return (
            <div className="flex flex-col gap-5">
                <CabecalhoComTitulo
                    titulo="Agendamento"
                    descricao="Área destinada aos clientes das barbearias."
                />
                <div className="container py-10 text-zinc-300">
                    Donos da plataforma gerenciam o SaaS pelo Admin SaaS.
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-5">
            <CabecalhoComTitulo
                titulo="Agendar horário"
                descricao="Escolha a barbearia, o profissional, o serviço e o melhor horário para você."
            />
            <div className="container py-10">
                {cliente && !barbeariaEscolhida ? (
                    <section className="rounded border border-zinc-800 bg-zinc-900 p-6">
                        <h2 className="text-2xl font-black text-zinc-100">Escolha uma barbearia</h2>
                        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                            Para agendar como cliente, primeiro selecione uma barbearia no mapa ou na lista pública.
                        </p>
                        <Link href="/barbearias" className="mt-5 inline-flex rounded bg-yellow-400 px-5 py-3 font-bold text-black">
                            Ver barbearias
                        </Link>
                    </section>
                ) : (
                    <FormularioAgendamento />
                )}
                <HistoricoAvaliacoes />
            </div>
        </div>
    )
}
