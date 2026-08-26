'use client'

import { Profissional } from '@barbabrutal/core'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'
import useSessao from './useSessao'

export default function useProfissionais() {
    const { httpGet } = useAPI()
    const { carregando } = useSessao()
    const [profissionais, setProfissionais] = useState<Profissional[]>([])

    const carregarProfissionais = useCallback(async () => {
        if (carregando) return
        const dados = await httpGet('/profissionais')
        setProfissionais(Array.isArray(dados) ? dados : [])
    }, [carregando, httpGet])

    useEffect(() => {
        carregarProfissionais()
    }, [carregarProfissionais])

    return {
        profissionais,
        carregarProfissionais,
    }
}
