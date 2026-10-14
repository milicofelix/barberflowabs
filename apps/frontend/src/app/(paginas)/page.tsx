'use client'

import NossosClientes from '@/components/cliente/NossosClientes'
import Slogan from '@/components/landing/Slogan'
import NossosProfissionais from '@/components/profissional/NossosProfissionais'
import NossosServicos from '@/components/servico/NossosServicos'
import Rodape from '@/components/shared/Rodape'
import useSessao from '@/data/hooks/useSessao'
import type { PropsWithChildren } from 'react'

function SecaoHome({ children }: PropsWithChildren) {
    return (
        <section className="bg-white py-10 dark:bg-zinc-950">
            <div className="container">{children}</div>
        </section>
    )
}

export default function Landing() {
    const { carregando, usuario } = useSessao()
    const papel = String(usuario?.role ?? usuario?.papel ?? '').toUpperCase()
    const operacional = !['SUPER_ADMIN', 'APP_OWNER'].includes(papel)
        && Boolean(usuario?.estabelecimentoId)
        && (Boolean(usuario?.membroEstabelecimento) || ['ESTABLISHMENT_OWNER', 'ESTABLISHMENT_MEMBER'].includes(papel))

    return (
        <div className="flex flex-col">
            <Slogan />
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
