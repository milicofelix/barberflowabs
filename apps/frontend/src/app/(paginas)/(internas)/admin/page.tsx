'use client'

import PainelSuperAdmin from '@/components/saas/PainelSuperAdmin'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'
import PainelSolicitacoesEstabelecimento from '@/components/saas/PainelSolicitacoesEstabelecimento'

export default function Page() {
    return (
        <div className="flex flex-col gap-5">
            <CabecalhoComTitulo
                titulo="Admin SaaS"
                descricao="Acompanhe estabelecimentos, assinaturas e auditoria."
            />
            <div className="container py-10">
                <PainelSolicitacoesEstabelecimento />
                <PainelSuperAdmin />
            </div>
        </div>
    )
}
