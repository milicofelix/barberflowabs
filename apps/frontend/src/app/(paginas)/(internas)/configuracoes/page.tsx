'use client'

import FormularioConfiguracaoAgenda from '@/components/configuracoes/FormularioConfiguracaoAgenda'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'
import useSessao from '@/data/hooks/useSessao'

export default function Page() {
    const { usuario } = useSessao()

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
                titulo="Configurações da Agenda"
                descricao="Defina expediente, intervalo de almoço e antecedência dos agendamentos."
            />
            <div className="container py-10">
                <FormularioConfiguracaoAgenda />
            </div>
        </div>
    )
}
