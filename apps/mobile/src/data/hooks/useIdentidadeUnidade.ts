import type { IdentidadeEstabelecimento } from '@uniflowabs/core'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useState } from 'react'
import { perfilOperacional, resolverPerfil } from '../auth/perfis'
import useAPI, { mensagemDoErro } from './useAPI'
import useSessao from './useSessao'

export type IdentidadeDaUnidade = IdentidadeEstabelecimento & {
    id: number
    nome?: string | null
    nomePublico?: string | null
}

const cache = new Map<number, IdentidadeDaUnidade>()
const requisicoes = new Map<number, Promise<IdentidadeDaUnidade>>()

export default function useIdentidadeUnidade() {
    const { usuario } = useSessao()
    const { httpGet } = useAPI()
    const operacional = perfilOperacional(resolverPerfil(usuario))
    const estabelecimentoId = operacional ? usuario?.estabelecimentoId ?? null : null
    const [unidade, setUnidade] = useState<IdentidadeDaUnidade | null>(() => estabelecimentoId ? cache.get(estabelecimentoId) ?? null : null)
    const [erro, setErro] = useState<string | null>(null)

    const carregar = useCallback(async (forcar = false) => {
        if (!estabelecimentoId) {
            setUnidade(null)
            setErro(null)
            return null
        }
        if (!forcar && cache.has(estabelecimentoId)) {
            const armazenada = cache.get(estabelecimentoId)!
            setUnidade(armazenada)
            setErro(null)
            return armazenada
        }
        let requisicao = requisicoes.get(estabelecimentoId)
        if (!requisicao) {
            requisicao = httpGet<IdentidadeDaUnidade>('/estabelecimentos/minha/perfil-publico')
            requisicoes.set(estabelecimentoId, requisicao)
        }
        try {
            const dados = await requisicao
            if (dados.id === estabelecimentoId) {
                cache.set(estabelecimentoId, dados)
                setUnidade(dados)
            }
            setErro(null)
            return dados
        } catch (e) {
            const armazenada = cache.get(estabelecimentoId) ?? null
            if (armazenada) setUnidade(armazenada)
            setErro(mensagemDoErro(e))
            return armazenada
        } finally {
            if (requisicoes.get(estabelecimentoId) === requisicao) requisicoes.delete(estabelecimentoId)
        }
    }, [estabelecimentoId, httpGet])

    useFocusEffect(useCallback(() => { void carregar(true) }, [carregar]))
    return { unidade, operacional, erro, carregar }
}
