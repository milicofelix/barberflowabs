'use client'

import { servicos as servicosPadrao, Servico } from '@barbabrutal/core'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'

export default function useServicos() {
    const { httpGet } = useAPI()
    const [servicos, setServicos] = useState<Servico[]>(servicosPadrao)

    const carregarServicos = useCallback(async () => {
        const dados = await httpGet('/servicos')
        setServicos(Array.isArray(dados) ? dados : servicosPadrao)
    }, [httpGet])

    useEffect(() => {
        carregarServicos()
    }, [carregarServicos])

    return {
        servicos,
        carregarServicos,
    }
}
