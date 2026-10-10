'use client'

import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

type Tema = 'light' | 'dark'

interface ContextoTemaProps {
    tema: Tema
    alternarTema: () => void
}

const CHAVE_TEMA = 'uniflowabs_tema_web'
const ContextoTema = createContext<ContextoTemaProps>({} as ContextoTemaProps)

export function ProvedorTema({ children }: PropsWithChildren) {
    const [tema, setTema] = useState<Tema>('light')
    const [inicializado, setInicializado] = useState(false)

    useEffect(() => {
        const temaSalvo = window.localStorage.getItem(CHAVE_TEMA)
        if (temaSalvo === 'dark') setTema('dark')
        setInicializado(true)
    }, [])

    useEffect(() => {
        if (!inicializado) return

        document.documentElement.classList.toggle('dark', tema === 'dark')
        document.documentElement.dataset.theme = tema
        document.documentElement.style.colorScheme = tema
        window.localStorage.setItem(CHAVE_TEMA, tema)
    }, [inicializado, tema])

    const valor = useMemo(() => ({
        tema,
        alternarTema: () => setTema((atual) => atual === 'light' ? 'dark' : 'light'),
    }), [tema])

    return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>
}

export default function useTema() {
    return useContext(ContextoTema)
}
