import type { EstabelecimentoSelecionado } from '@/src/data/estabelecimentos/tipos'
import { createContext, type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'

const CHAVE_ESTABELECIMENTO = 'barberflow:estabelecimento-selecionado'

export interface ContextoEstabelecimentoProps {
    estabelecimento: EstabelecimentoSelecionado | null
    carregando: boolean
    selecionarEstabelecimento: (estabelecimento: EstabelecimentoSelecionado) => Promise<void>
    limparEstabelecimento: () => Promise<void>
}

const ContextoEstabelecimento = createContext<ContextoEstabelecimentoProps>({} as ContextoEstabelecimentoProps)

export function ProvedorEstabelecimento({ children }: PropsWithChildren) {
    const { get, set, remove } = useLocalStorage()
    const [estabelecimento, setEstabelecimento] = useState<EstabelecimentoSelecionado | null>(null)
    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        get(CHAVE_ESTABELECIMENTO)
            .then((valor) => setEstabelecimento(valor && valor.id && valor.slug ? valor : null))
            .finally(() => setCarregando(false))
    }, [get])

    const selecionarEstabelecimento = useCallback(async (novoEstabelecimento: EstabelecimentoSelecionado) => {
        setEstabelecimento(novoEstabelecimento)
        await set(CHAVE_ESTABELECIMENTO, novoEstabelecimento)
    }, [set])

    const limparEstabelecimento = useCallback(async () => {
        setEstabelecimento(null)
        await remove(CHAVE_ESTABELECIMENTO)
    }, [remove])

    const valor = useMemo(() => ({ estabelecimento, carregando, selecionarEstabelecimento, limparEstabelecimento }), [
        estabelecimento, carregando, selecionarEstabelecimento, limparEstabelecimento,
    ])

    return <ContextoEstabelecimento.Provider value={valor}>{children}</ContextoEstabelecimento.Provider>
}

export default ContextoEstabelecimento
