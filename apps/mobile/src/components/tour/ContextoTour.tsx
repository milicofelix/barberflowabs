import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type PropsWithChildren } from 'react'
import { ControladorTour, type DefinicaoTour } from '@uniflowabs/core'
import { RegistroAlvosTour } from '@/src/data/tour/alvos'
import { persistenciaTourMobile } from '@/src/data/tour/persistencia'

interface ContextoTourValor { controlador: ControladorTour; alvos: RegistroAlvosTour }
const ContextoTour = createContext<ContextoTourValor | null>(null)

/** Um provedor por jornada/tela, com definição estável; não instalar globalmente sobre o app. */
export function ProvedorTour({ definicao, children }: PropsWithChildren<{ definicao: DefinicaoTour }>) {
    const valor = useMemo(() => {
        const alvos = new RegistroAlvosTour()
        return { controlador: new ControladorTour(definicao, persistenciaTourMobile, undefined, undefined, alvos.possui), alvos }
    }, [definicao])
    useEffect(() => {
        void valor.controlador.carregar()
        return () => { valor.controlador.suspender() }
    }, [valor])
    return <ContextoTour.Provider value={valor}>{children}</ContextoTour.Provider>
}

export function useTour() {
    const contexto = useContext(ContextoTour)
    if (!contexto) throw new Error('Use o tour dentro de ProvedorTour')
    const snapshot = useSyncExternalStore(contexto.controlador.observar, contexto.controlador.obterSnapshot, contexto.controlador.obterSnapshot)
    return { ...contexto, ...snapshot }
}
