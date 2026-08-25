import { profissionais as profissionaisPadrao, Profissional } from '@barbabrutal/core'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'

export default function useProfissionais() {
    const { httpGet } = useAPI()
    const [profissionais, setProfissionais] = useState<Profissional[]>(profissionaisPadrao)

    const carregarProfissionais = useCallback(async () => {
        const dados = await httpGet('/profissionais')
        setProfissionais(Array.isArray(dados) ? dados : profissionaisPadrao)
    }, [httpGet])

    useEffect(() => {
        carregarProfissionais()
    }, [carregarProfissionais])

    return {
        profissionais,
        carregarProfissionais,
    }
}
