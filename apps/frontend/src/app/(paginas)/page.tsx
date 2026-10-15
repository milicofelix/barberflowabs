'use client'

import NossosClientes from '@/components/cliente/NossosClientes'
import Slogan from '@/components/landing/Slogan'
import NossosProfissionais from '@/components/profissional/NossosProfissionais'
import NossosServicos from '@/components/servico/NossosServicos'
import Rodape from '@/components/shared/Rodape'
import { usuarioOperacional } from '@/data/hooks/useIdentidadeUnidade'
import useSessao from '@/data/hooks/useSessao'
import type { PropsWithChildren } from 'react'
import AtendimentosOperacionais from '@/components/gestao/AtendimentosOperacionais'

function SecaoHome({ children }: PropsWithChildren) {
    return (
        <section className="bg-white py-10 dark:bg-zinc-950">
            <div className="container">{children}</div>
        </section>
    )
}

export default function Landing() {
    const { carregando, usuario } = useSessao()
    const operacional = usuarioOperacional(usuario)

    return (
        <div className="flex flex-col">
            <Slogan />
            {!carregando && operacional ? <SecaoHome><AtendimentosOperacionais key={usuario?.estabelecimentoId} modo="home" /></SecaoHome> : null}
            {!carregando && !operacional ? (
                <>
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
                </>
            ) : null}
        </div>
    )
}
