'use client'

import useSessao from '@/data/hooks/useSessao'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type PropsWithChildren } from 'react'

const ROTAS_CLIENTE = ['/estabelecimentos', '/servicos', '/profissionais', '/agendamento']

/** Separa a experiência administrativa da descoberta pública, sem montar mapa ou seus hooks. */
export default function SeparacaoPerfilPlataforma({ children }: PropsWithChildren) {
    const { usuario, carregando } = useSessao()
    const caminho = usePathname()
    const router = useRouter()
    const admin = [usuario?.role, usuario?.papel].some(papel => ['SUPER_ADMIN', 'APP_OWNER'].includes(String(papel).toUpperCase()))
    const areaCliente = caminho === '/' || ROTAS_CLIENTE.some(rota => caminho === rota || caminho?.startsWith(`${rota}/`))

    useEffect(() => {
        if (!carregando && admin && areaCliente) router.replace('/admin')
    }, [admin, areaCliente, carregando, router])

    if (areaCliente && (carregando || admin)) {
        return <div className="flex min-h-screen items-center justify-center bg-white p-6 text-slate-900 dark:bg-slate-950 dark:text-white" role="status">
            {carregando ? 'Carregando sua sessão…' : 'Abrindo administração…'}
        </div>
    }
    return children
}
