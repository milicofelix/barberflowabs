'use client'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'

export interface NotificacaoUsuario { id: number; titulo: string; mensagem: string; acaoUrl?: string | null; lidaEm?: string | null; createdAt: string }
const INTERVALO_ATUALIZACAO_MS = 15_000

export default function useNotificacoes() {
    const { httpGet, httpPut } = useAPI()
    const [itens, setItens] = useState<NotificacaoUsuario[]>([])
    const carregar = useCallback(async () => {
        const resposta = await httpGet('/notificacoes')
        setItens(Array.isArray(resposta) ? resposta : [])
    }, [httpGet])
    useEffect(() => {
        carregar()
        const intervalo = window.setInterval(carregar, INTERVALO_ATUALIZACAO_MS)
        const atualizarAoRetornar = () => { if (document.visibilityState === 'visible') carregar() }
        document.addEventListener('visibilitychange', atualizarAoRetornar)
        window.addEventListener('focus', carregar)
        return () => {
            window.clearInterval(intervalo)
            document.removeEventListener('visibilitychange', atualizarAoRetornar)
            window.removeEventListener('focus', carregar)
        }
    }, [carregar])
    async function ler(id: number) { await httpPut(`/notificacoes/${id}/ler`, {}); await carregar() }
    async function lerTodas() { await httpPut('/notificacoes/ler-todas', {}); await carregar() }
    return { itens, naoLidas: itens.filter((item) => !item.lidaEm).length, carregar, ler, lerTodas }
}
