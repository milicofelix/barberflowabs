'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import useSessao from '@/data/hooks/useSessao'
import Processando from './Processando'

export default function ForcarAutenticacao(props: any) {
    const { usuario, carregando } = useSessao()
    const router = useRouter()
    const caminho = usePathname()

    useEffect(() => {
        if (carregando || usuario?.email) return

        const query = window.location.search
        const destino = `${caminho}${query}`
        router.replace(`/entrar?destino=${encodeURIComponent(destino)}`)
    }, [carregando, caminho, router, usuario?.email])

    if (carregando && !usuario?.email) return <Processando />
    if (!usuario?.email) {
        return <Processando />
    }

    return props.children
}
