import NossosClientes from '@/components/cliente/NossosClientes'
import Slogan from '@/components/landing/Slogan'
import NossosProfissionais from '@/components/profissional/NossosProfissionais'
import NossosServicos from '@/components/servico/NossosServicos'
import Rodape from '@/components/shared/Rodape'
import type { PropsWithChildren } from 'react'

function SecaoHome({ children }: PropsWithChildren) {
    return (
        <section className="bg-white py-10 dark:bg-zinc-950">
            <div className="container">{children}</div>
        </section>
    )
}

export default function Landing() {
    return (
        <div className="flex flex-col">
            <Slogan />
            <SecaoHome>
                <NossosServicos />
            </SecaoHome>
            <SecaoHome>
                <NossosProfissionais />
            </SecaoHome>
            <SecaoHome>
                <NossosClientes />
            </SecaoHome>
            <Rodape />
        </div>
    )
}
