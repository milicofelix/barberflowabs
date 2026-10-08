import { Servico } from '@barbabrutal/core'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'
import useSessao from './useSessao'
import { mensagemDoErro } from './useAPI'

export default function useServicos() {
    const { httpGet } = useAPI()
    const { carregando } = useSessao()
    const [servicos, setServicos] = useState<Servico[]>([])
    const [erro, setErro] = useState<string | null>(null)
    const [carregandoServicos, setCarregandoServicos] = useState(false)

    const carregarServicos = useCallback(async () => {
        if (carregando) return
        try {
            setCarregandoServicos(true)
            setErro(null)
            const dados = await httpGet<Servico[]>('/servicos')
            setServicos(Array.isArray(dados) ? dados : [])
        } catch (erro) {
            setServicos([])
            setErro(mensagemDoErro(erro))
        } finally {
            setCarregandoServicos(false)
        }
    }, [carregando, httpGet])

    useEffect(() => {
        carregarServicos()
    }, [carregarServicos])

    return {
        servicos,
        erro,
        carregando: carregandoServicos,
        carregarServicos,
    }
}
