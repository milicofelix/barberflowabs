import { ProvedorAgendamento } from '@/data/contexts/ContextoAgendamento'
import NavegacaoPublica from '@/components/shared/NavegacaoPublica'

export default function Layout(props: any) {
    return (
        <ProvedorAgendamento>
            <NavegacaoPublica voltarPara="/estabelecimentos" voltarLabel="Voltar aos estabelecimentos" />
            {props.children}
        </ProvedorAgendamento>
    )
}
