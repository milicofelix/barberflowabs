'use client'

import { Profissional } from '@uniflowabs/core'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'

export default function useProfissionais() {
    const { httpGet } = useAPI()
    const [profissionais, setProfissionais] = useState<Profissional[]>([])

    const carregarProfissionais = useCallback(async () => {
        const dados = await httpGet('/public/estabelecimentos/profissionais')
        setProfissionais(Array.isArray(dados) ? dados : [])
    }, [httpGet])

    useEffect(() => {
        carregarProfissionais()
    }, [carregarProfissionais])

    return {
        profissionais,
        carregarProfissionais,
    }
}
