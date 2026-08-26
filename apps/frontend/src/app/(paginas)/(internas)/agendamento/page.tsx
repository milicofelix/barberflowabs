'use client'

import FormularioAgendamento from '@/components/agendamento/FormularioAgendamento'
import HistoricoAvaliacoes from '@/components/agendamento/HistoricoAvaliacoes'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'
import useSessao from '@/data/hooks/useSessao'

export default function Page() {
    const { usuario } = useSessao()
    const superAdmin = usuario?.role === 'SUPER_ADMIN' || usuario?.papel === 'SUPER_ADMIN'

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
                titulo="Agendamento de Servicos"
                descricao="Seja atendido exatamente no horário marcado."
            />
            <div className="container py-10">
                <FormularioAgendamento />
                <HistoricoAvaliacoes />
            </div>
        </div>
    )
}
