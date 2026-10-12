import type { DadosServicoOperacional, ServicoOperacional } from '../operacao/tipos'
import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useState } from 'react'

function preparar(dados: DadosServicoOperacional) {
    const duracaoMinutos = Number(dados.duracaoMinutos ?? 15)
    return {
        ...dados,
        preco: Number(dados.preco),
        duracaoMinutos,
        qtdeSlots: Math.ceil(duracaoMinutos / 15),
        preparoAntesMinutos: Number(dados.preparoAntesMinutos ?? 0),
        preparoDepoisMinutos: Number(dados.preparoDepoisMinutos ?? 0),
        deslocamentoMinutos: Number(dados.deslocamentoMinutos ?? 0),
        observacoes: dados.observacoes?.trim() || null,
    }
}

export default function useGestaoServicos(ativo: boolean) {
    const { httpDelete, httpGet, httpPost, httpPut } = useAPI()
    const [servicos, setServicos] = useState<ServicoOperacional[]>([])
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const carregar = useCallback(async () => {
        try {
            setCarregando(true)
            setErro(null)
            const resposta = await httpGet<ServicoOperacional[]>('/servicos')
            setServicos(Array.isArray(resposta) ? resposta : [])
        } catch (e) {
            setErro(mensagemDoErro(e))
        } finally {
            setCarregando(false)
        }
    }, [httpGet])

    useEffect(() => {
        if (ativo) carregar()
    }, [ativo, carregar])

    const executar = useCallback(async (acao: () => Promise<unknown>) => {
        try {
            setErro(null)
            await acao()
            await carregar()
            return true
        } catch (e) {
            setErro(mensagemDoErro(e))
            return false
        }
    }, [carregar])

    const salvar = (dados: DadosServicoOperacional, id?: number) => {
        const payload = preparar(dados)
        return executar(() => id ? httpPut(`/servicos/${id}`, payload) : httpPost('/servicos', payload))
    }

    const excluir = (id: number) => executar(() => httpDelete(`/servicos/${id}`))

    return { servicos, carregando, erro, carregar, salvar, excluir }
}
