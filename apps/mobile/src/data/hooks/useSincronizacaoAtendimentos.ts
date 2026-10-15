import { useEffect, useState } from 'react'
import { AppState, DeviceEventEmitter } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import useAPI from './useAPI'

export const EVENTO_ATENDIMENTOS = 'uniflow:atendimentos-atualizados'

/** Pausa em segundo plano/fora da aba; reconcilia ao retomar e a cada minuto. */
export default function useSincronizacaoAtendimentos(carregar: () => Promise<boolean>, ativo = true) {
    const { httpGet } = useAPI()
    const focado = useIsFocused()
    const [agora, setAgora] = useState(Date.now())
    useEffect(() => {
        if (!focado) return
        setAgora(Date.now())
        const timer = setInterval(() => { if (AppState.currentState === 'active') setAgora(Date.now()) }, 5_000)
        return () => clearInterval(timer)
    }, [focado])
    useEffect(() => {
        if (!ativo || !focado) return
        let vivo = true; let ocupado = false; let revisao: number | null = null; let ultima = 0
        async function sincronizar(forcar = false) {
            if (!vivo || ocupado || AppState.currentState !== 'active') return
            ocupado = true
            try {
                const atual = await httpGet<{ revisao: number }>('/gestao/agenda/revisao')
                if (!vivo) return
                if (forcar || atual.revisao !== revisao || Date.now() - ultima >= 60_000) {
                    if (await carregar()) { revisao = atual.revisao; ultima = Date.now() }
                }
            } catch { if (vivo) await carregar() } // apresenta o erro sem apagar registros anteriores
            finally { ocupado = false }
        }
        void sincronizar(true)
        const timer = setInterval(() => { void sincronizar() }, 5_000)
        const estado = AppState.addEventListener('change', (valor) => { if (valor === 'active') void sincronizar(true) })
        const evento = DeviceEventEmitter.addListener(EVENTO_ATENDIMENTOS, () => { void sincronizar(true) })
        return () => { vivo = false; clearInterval(timer); estado.remove(); evento.remove() }
    }, [ativo, focado, carregar, httpGet])
    return agora
}
