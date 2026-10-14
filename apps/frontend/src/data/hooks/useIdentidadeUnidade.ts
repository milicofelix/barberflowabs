'use client'

import type { IdentidadeEstabelecimento } from '@uniflowabs/core'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'
import useSessao from './useSessao'

export type IdentidadeDaUnidade = IdentidadeEstabelecimento & {
    id: number
    nome?: string | null
    nomePublico?: string | null
}

const cache = new Map<number, IdentidadeDaUnidade>()
const requisicoes = new Map<number, Promise<IdentidadeDaUnidade>>()

export function usuarioOperacional(usuario: ReturnType<typeof useSessao>['usuario']) {
    const papel = String(usuario?.role ?? usuario?.papel ?? '').toUpperCase()
    return !['SUPER_ADMIN', 'APP_OWNER'].includes(papel)
        && Boolean(usuario?.estabelecimentoId)
        && (Boolean(usuario?.membroEstabelecimento) || ['ESTABLISHMENT_OWNER', 'ESTABLISHMENT_MEMBER'].includes(papel))
}

export default function useIdentidadeUnidade() {
    const { usuario } = useSessao()
    const { httpGet } = useAPI()
    const operacional = usuarioOperacional(usuario)
    const estabelecimentoId = operacional ? usuario?.estabelecimentoId ?? null : null
    const [unidade, setUnidade] = useState<IdentidadeDaUnidade | null>(() => estabelecimentoId ? cache.get(estabelecimentoId) ?? null : null)

    const carregar = useCallback(async (forcar = false) => {
        if (!estabelecimentoId) {
            setUnidade(null)
            return null
        }
        if (!forcar && cache.has(estabelecimentoId)) {
            const armazenada = cache.get(estabelecimentoId)!
            setUnidade(armazenada)
            return armazenada
        }
        let requisicao = requisicoes.get(estabelecimentoId)
        if (!requisicao) {
            requisicao = httpGet('/estabelecimentos/minha/perfil-publico') as Promise<IdentidadeDaUnidade>
            requisicoes.set(estabelecimentoId, requisicao)
        }
        try {
            const dados = await requisicao
            if (dados.id === estabelecimentoId) {
                cache.set(estabelecimentoId, dados)
                setUnidade(dados)
            }
            return dados
        } finally {
            if (requisicoes.get(estabelecimentoId) === requisicao) requisicoes.delete(estabelecimentoId)
        }
    }, [estabelecimentoId, httpGet])

    useEffect(() => { void carregar() }, [carregar])
    useEffect(() => {
        if (!operacional) return
        const atualizar = () => { void carregar(true) }
        window.addEventListener('focus', atualizar)
        return () => window.removeEventListener('focus', atualizar)
    }, [carregar, operacional])

    return { unidade, operacional, carregar }
}
