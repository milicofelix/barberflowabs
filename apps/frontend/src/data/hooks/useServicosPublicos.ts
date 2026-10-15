'use client'

import type { Servico } from '@uniflowabs/core'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'

export type ServicoPublico = Servico & {
    estabelecimento: { id: number; slug: string; nome: string }
}

export default function useServicosPublicos() {
    const { httpGet } = useAPI()
    const [servicos, setServicos] = useState<ServicoPublico[]>([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const carregarServicos = useCallback(async () => {
        setCarregando(true); setErro(null)
        try {
            const dados = await httpGet('/public/estabelecimentos/servicos')
            if (!Array.isArray(dados)) throw new Error(dados?.message ?? 'Não foi possível carregar os serviços.')
            setServicos(dados)
        } catch (e) {
            setServicos([])
            setErro(e instanceof Error ? e.message : 'Não foi possível carregar os serviços.')
        } finally { setCarregando(false) }
    }, [httpGet])

    useEffect(() => { void carregarServicos() }, [carregarServicos])
    return { servicos, carregando, erro, carregarServicos }
}
