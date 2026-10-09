import { Profissional } from '@barbabrutal/core'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'
import useSessao from './useSessao'
import { mensagemDoErro } from './useAPI'

export default function useProfissionais() {
    const { httpGet } = useAPI()
    const { carregando } = useSessao()
    const [profissionais, setProfissionais] = useState<Profissional[]>([])
    const [erro, setErro] = useState<string | null>(null)
    const [carregandoProfissionais, setCarregandoProfissionais] = useState(false)

    const carregarProfissionais = useCallback(async () => {
        if (carregando) return
        try {
            setCarregandoProfissionais(true)
            setErro(null)
            const dados = await httpGet<Profissional[]>('/profissionais', { escopoTenant: 'publico' })
            setProfissionais(Array.isArray(dados) ? dados : [])
        } catch (erro) {
            setProfissionais([])
            setErro(mensagemDoErro(erro))
        } finally {
            setCarregandoProfissionais(false)
        }
    }, [carregando, httpGet])

    useEffect(() => {
        carregarProfissionais()
    }, [carregarProfissionais])

    return {
        profissionais,
        erro,
        carregando: carregandoProfissionais,
        carregarProfissionais,
    }
}
