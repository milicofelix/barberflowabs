'use client'

import PainelBilling from '@/components/saas/PainelBilling'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'
import useSessao from '@/data/hooks/useSessao'

export default function Page() {
    const { usuario } = useSessao()
    const superAdmin = usuario?.role === 'SUPER_ADMIN' || usuario?.papel === 'SUPER_ADMIN'

    if (!usuario?.barbeiro && !superAdmin) {
        return (
            <div className="flex flex-col gap-5">
                <CabecalhoComTitulo
                    titulo="Billing"
                    descricao="Acesso restrito aos responsáveis pela barbearia."
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
                titulo="Billing"
                descricao="Gerencie plano, trial e limites da barbearia."
            />
            <div className="container py-10">
                <PainelBilling />
            </div>
        </div>
    )
}
