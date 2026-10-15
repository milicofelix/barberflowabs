'use client'

import { CentralRelacionamentoStore, objetoRelacionamento } from '@uniflowabs/core'
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import useAPI from './useAPI'
import useSessao from './useSessao'

export default function useCentralRelacionamento() {
    const api = useAPI(); const atual = useRef(api); atual.current = api
    const { usuario, token } = useSessao()
    const store = useMemo(() => {
        async function conferir(resposta: Promise<unknown>) {
            const dados = await resposta; const erro = objetoRelacionamento(dados)
            if ('statusCode' in erro && (Number(erro.statusCode) >= 400 || Number(erro.statusCode) === 0)) throw new Error(Array.isArray(erro.message) ? erro.message.join('\n') : String(erro.message ?? 'Falha na solicitação'))
            return dados
        }
        return new CentralRelacionamentoStore({ get: caminho => conferir(atual.current.httpGet(caminho)), post: (caminho, body) => conferir(atual.current.httpPost(caminho, body)), put: (caminho, body) => conferir(atual.current.httpPut(caminho, body)) })
    }, [usuario?.id, usuario?.estabelecimentoId, token])
    const estado = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
    useEffect(() => { void store.iniciar(); return store.encerrar }, [store])
    useEffect(() => { const foco = () => { void store.recarregar() }; window.addEventListener('focus', foco); return () => window.removeEventListener('focus', foco) }, [store])
    return { store, ...estado }
}
