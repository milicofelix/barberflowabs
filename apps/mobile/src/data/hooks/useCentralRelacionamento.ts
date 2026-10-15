import { CentralRelacionamentoStore } from '@uniflowabs/core'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { AppState } from 'react-native'
import useAPI from './useAPI'
import useSessao from './useSessao'

export default function useCentralRelacionamento() {
    const api = useAPI(); const atual = useRef(api); atual.current = api
    const { usuario, token } = useSessao()
    const store = useMemo(() => new CentralRelacionamentoStore({ get: caminho => atual.current.httpGet(caminho), post: (caminho, body) => atual.current.httpPost(caminho, body), put: (caminho, body) => atual.current.httpPut(caminho, body) }), [usuario?.id, usuario?.estabelecimentoId, token])
    const estado = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
    useEffect(() => { void store.iniciar(); return store.encerrar }, [store])
    useEffect(() => { const inscricao = AppState.addEventListener('change', estado => { if (estado === 'active') void store.recarregar() }); return () => inscricao.remove() }, [store])
    return { store, ...estado }
}
