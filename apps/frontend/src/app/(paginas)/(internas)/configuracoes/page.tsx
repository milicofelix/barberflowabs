'use client'

import FormularioConfiguracaoAgenda from '@/components/configuracoes/FormularioConfiguracaoAgenda'
import FormularioPerfilPublicoBarbearia from '@/components/configuracoes/FormularioPerfilPublicoBarbearia'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'
import useSessao from '@/data/hooks/useSessao'
import { CalendarDays, MapPinned } from 'lucide-react'
import { useState } from 'react'

export default function Page() {
    const { usuario } = useSessao()
    const [aba, setAba] = useState<'agenda' | 'perfil'>('perfil')

    if (!usuario?.barbeiro) {
        return (
            <div className="flex flex-col gap-5">
                <CabecalhoComTitulo
                    titulo="Configurações"
                    descricao="Acesso restrito aos responsáveis pela barbearia."
                />
                <div className="container py-10 text-zinc-300">
                    Você não tem permissão para alterar estas configurações.
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-5">
            <CabecalhoComTitulo
                titulo="Configurações"
                descricao="Defina perfil público, localização e agenda da barbearia."
            />
            <div className="container grid gap-6 py-10">
                <div className="flex w-fit rounded border border-zinc-800 bg-zinc-900 p-1">
                    <button type="button" onClick={() => setAba('perfil')} className={classeAba(aba === 'perfil')}>
                        <MapPinned size={18} />
                        Perfil público
                    </button>
                    <button type="button" onClick={() => setAba('agenda')} className={classeAba(aba === 'agenda')}>
                        <CalendarDays size={18} />
                        Agenda
                    </button>
                </div>
                {aba === 'perfil' ? <FormularioPerfilPublicoBarbearia /> : <FormularioConfiguracaoAgenda />}
            </div>
        </div>
    )
}

function classeAba(ativa: boolean) {
    return `inline-flex h-10 items-center gap-2 rounded px-4 text-sm font-bold ${
        ativa ? 'bg-yellow-400 text-black' : 'text-zinc-300'
    }`
}
