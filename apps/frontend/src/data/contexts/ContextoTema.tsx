'use client'

import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'

type Tema = 'light' | 'dark'

interface ContextoTemaProps {
    tema: Tema
    alternarTema: () => void
}

const CHAVE_TEMA = 'uniflowabs_tema_web_preferencia_v2'
const HORA_INICIO_TEMA_CLARO = 6
const HORA_INICIO_TEMA_ESCURO = 18
const ContextoTema = createContext<ContextoTemaProps>({} as ContextoTemaProps)

function temaDoHorario(): Tema {
    const hora = new Date().getHours()
    return hora >= HORA_INICIO_TEMA_CLARO && hora < HORA_INICIO_TEMA_ESCURO ? 'light' : 'dark'
}

export function ProvedorTema({ children }: PropsWithChildren) {
    const [tema, setTema] = useState<Tema>('light')
    const [preferencia, setPreferencia] = useState<Tema | null>(null)
    const [inicializado, setInicializado] = useState(false)

    useEffect(() => {
        const temaSalvo = window.localStorage.getItem(CHAVE_TEMA)
        if (temaSalvo === 'light' || temaSalvo === 'dark') {
            setPreferencia(temaSalvo)
            setTema(temaSalvo)
        } else {
            setTema(temaDoHorario())
        }
        setInicializado(true)
    }, [])

    useEffect(() => {
        if (!inicializado || preferencia) return
        const atualizarPeloHorario = () => setTema(temaDoHorario())
        const intervalo = window.setInterval(atualizarPeloHorario, 60_000)
        return () => window.clearInterval(intervalo)
    }, [inicializado, preferencia])

    useEffect(() => {
        if (!inicializado) return

        document.documentElement.classList.toggle('dark', tema === 'dark')
        document.documentElement.dataset.theme = tema
        document.documentElement.style.colorScheme = tema
    }, [inicializado, tema])

    const valor = useMemo(() => ({
        tema,
        alternarTema: () => setTema((atual) => {
            const proximo = atual === 'light' ? 'dark' : 'light'
            setPreferencia(proximo)
            window.localStorage.setItem(CHAVE_TEMA, proximo)
            return proximo
        }),
    }), [tema])

    return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>
}

export default function useTema() {
    return useContext(ContextoTema)
}
