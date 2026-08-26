'use client'

import FormularioAgendamento from '@/components/agendamento/FormularioAgendamento'
import HistoricoAvaliacoes from '@/components/agendamento/HistoricoAvaliacoes'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'

export default function Page() {
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
