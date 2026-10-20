'use client'

import PainelFinanceiro from '@/components/financeiro/PainelFinanceiro'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'
import useSessao from '@/data/hooks/useSessao'

export default function Page() {
    const { usuario } = useSessao()
    const permitido = usuario?.membroEstabelecimento && usuario?.papel !== 'SUPER_ADMIN'
    return <div className="flex flex-col gap-5"><CabecalhoComTitulo titulo="Financeiro" descricao="Caixa, comissões, repasses, contas, pagamentos e conciliação." /><div className="container py-10">{permitido ? <PainelFinanceiro /> : <p className="text-muted-foreground">Acesso restrito à equipe do estabelecimento.</p>}</div></div>
}
