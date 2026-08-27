'use client'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import useSessao from '@/data/hooks/useSessao'
import Processando from './Processando'

export default function ForcarAutenticacao(props: any) {
    const { usuario, carregando } = useSessao()
    const router = useRouter()
    const caminho = usePathname()
    const params = useSearchParams()
    const query = params.toString()
    const destino = query ? `${caminho}?${query}` : caminho

    if (carregando && !usuario?.email) return <Processando />
    if (!usuario?.email) {
        router.push(`/entrar?destino=${encodeURIComponent(destino)}`)
        return <Processando />
    }

    return props.children
}
