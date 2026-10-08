import type { BarbeariaSelecionada } from '@/src/data/barbearias/tipos'
import { createContext, type PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'

const CHAVE_BARBEARIA = 'barberflow:barbearia-selecionada'

export interface ContextoBarbeariaProps {
    barbearia: BarbeariaSelecionada | null
    carregando: boolean
    selecionarBarbearia: (barbearia: BarbeariaSelecionada) => Promise<void>
    limparBarbearia: () => Promise<void>
}

const ContextoBarbearia = createContext<ContextoBarbeariaProps>({} as ContextoBarbeariaProps)

export function ProvedorBarbearia({ children }: PropsWithChildren) {
    const { get, set, remove } = useLocalStorage()
    const [barbearia, setBarbearia] = useState<BarbeariaSelecionada | null>(null)
    const [carregando, setCarregando] = useState(true)

    useEffect(() => {
        get(CHAVE_BARBEARIA)
            .then((valor) => setBarbearia(valor && valor.id && valor.slug ? valor : null))
            .finally(() => setCarregando(false))
    }, [get])

    const selecionarBarbearia = useCallback(async (novaBarbearia: BarbeariaSelecionada) => {
        setBarbearia(novaBarbearia)
        await set(CHAVE_BARBEARIA, novaBarbearia)
    }, [set])

    const limparBarbearia = useCallback(async () => {
        setBarbearia(null)
        await remove(CHAVE_BARBEARIA)
    }, [remove])

    const valor = useMemo(() => ({ barbearia, carregando, selecionarBarbearia, limparBarbearia }), [
        barbearia, carregando, selecionarBarbearia, limparBarbearia,
    ])

    return <ContextoBarbearia.Provider value={valor}>{children}</ContextoBarbearia.Provider>
}

export default ContextoBarbearia
