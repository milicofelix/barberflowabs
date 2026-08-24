import AgendadoComSucesso from '@/components/agendamento/AgendadoComSucesso'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'

export default function Page() {
    return (
        <div className="flex flex-col">
            <CabecalhoComTitulo
                titulo="Agendamento de Serviços"
                descricao="Seu horário está garantido e será um prazer te atender!"
            />
            <div className="container py-10">
                <AgendadoComSucesso />
            </div>
        </div>
    )
}
