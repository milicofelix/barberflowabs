'use client'

import { Servico } from '@barbabrutal/core'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'
import useSessao from './useSessao'

export default function useServicos() {
    const { httpGet } = useAPI()
    const { carregando } = useSessao()
    const [servicos, setServicos] = useState<Servico[]>([])

    const carregarServicos = useCallback(async () => {
        if (carregando) return
        const dados = await httpGet('/servicos')
        setServicos(Array.isArray(dados) ? dados : [])
    }, [carregando, httpGet])

    useEffect(() => {
        carregarServicos()
    }, [carregarServicos])

    return {
        servicos,
        carregarServicos,
    }
}
