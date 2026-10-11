import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ModoTema = 'dark' | 'light'

const paletas = {
    dark: {
        fundo: '#081426', superficie: '#101E33', superficieElevada: '#17263D', borda: '#31415A',
        texto: '#F8FAFC', textoSecundario: '#AEBBCE', campo: '#17263D', campoTexto: '#F8FAFC',
        destaque: '#E7B84B', destaqueTexto: '#081426', perigo: '#F97066', sucesso: '#48C78E',
        tabBar: '#081426', sobreposicao: 'rgba(0,0,0,0.72)',
    },
    light: {
        fundo: '#F3F6FA', superficie: '#FFFFFF', superficieElevada: '#E9EEF5', borda: '#CBD5E1',
        texto: '#0F172A', textoSecundario: '#526078', campo: '#F8FAFC', campoTexto: '#111827',
        destaque: '#B7791F', destaqueTexto: '#FFFFFF', perigo: '#B42318', sucesso: '#178558',
        tabBar: '#FFFFFF', sobreposicao: 'rgba(15,23,42,0.55)',
    },
} as const

export type CoresTema = typeof paletas.dark | typeof paletas.light

interface ContextoTemaValor {
    modo: ModoTema
    cores: CoresTema
    alternarTema: () => void
}

const ContextoTema = createContext<ContextoTemaValor>({} as ContextoTemaValor)
const CHAVE_TEMA = '@uniflowabs/tema'
const HORA_INICIO_TEMA_CLARO = 6
const HORA_INICIO_TEMA_ESCURO = 18

function temaDoHorario(): ModoTema {
    const hora = new Date().getHours()
    return hora >= HORA_INICIO_TEMA_CLARO && hora < HORA_INICIO_TEMA_ESCURO ? 'light' : 'dark'
}

export function ProvedorTema({ children }: { children: ReactNode }) {
    const [modo, setModo] = useState<ModoTema>(temaDoHorario)
    const [preferencia, setPreferencia] = useState<ModoTema | null>(null)

    useEffect(() => {
        AsyncStorage.getItem(CHAVE_TEMA).then((salvo) => {
            if (salvo === 'light' || salvo === 'dark') {
                setPreferencia(salvo)
                setModo(salvo)
            }
        }).catch(() => undefined)
    }, [])

    useEffect(() => {
        if (preferencia) return
        const atualizarPeloHorario = () => setModo(temaDoHorario())
        atualizarPeloHorario()
        const intervalo = setInterval(atualizarPeloHorario, 60_000)
        return () => clearInterval(intervalo)
    }, [preferencia])

    const valor = useMemo(() => ({
        modo,
        cores: paletas[modo],
        alternarTema: () => setModo((atual) => {
            const proximo = atual === 'dark' ? 'light' : 'dark'
            setPreferencia(proximo)
            AsyncStorage.setItem(CHAVE_TEMA, proximo).catch(() => undefined)
            return proximo
        }),
    }), [modo])

    return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>
}

export default function useTema() {
    return useContext(ContextoTema)
}
