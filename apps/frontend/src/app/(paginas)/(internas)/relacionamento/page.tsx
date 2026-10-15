'use client'

import CentralRelacionamento from '@/components/relacionamento/CentralRelacionamento'
import CabecalhoComTitulo from '@/components/shared/CabecalhoComTitulo'

export default function Page() {
    return <><CabecalhoComTitulo titulo="Relacionamento" descricao="Clientes, comunicação e fidelização da unidade." /><div className="container py-8"><CentralRelacionamento /></div></>
}
