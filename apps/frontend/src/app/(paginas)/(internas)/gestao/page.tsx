'use client'

import PainelGestaoOperacional from '@/components/gestao/PainelGestaoOperacional'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'
import useSessao from '@/data/hooks/useSessao'
import { Suspense } from 'react'

export default function Page() {
    const { usuario } = useSessao()
    const superAdmin = usuario?.role === 'SUPER_ADMIN' || usuario?.papel === 'SUPER_ADMIN'

    if (!usuario?.membroEstabelecimento || superAdmin) {
        return (
            <div className="flex flex-col gap-5">
                <CabecalhoComTitulo
                    titulo="Gestão"
                    descricao="Acesso restrito aos responsáveis pelo estabelecimento."
                />
                <div className="container py-10 text-zinc-300">
                    Você não tem permissão para acessar esta área.
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-5">
            <CabecalhoComTitulo
                titulo="Gestão Operacional"
                descricao="Gerencie serviços e profissionais do estabelecimento."
            />
            <div className="container py-10">
                <Suspense fallback={<p>Carregando operação...</p>}><PainelGestaoOperacional /></Suspense>
            </div>
        </div>
    )
}
