'use client'
import { useCallback, useEffect, useState } from 'react'
import useAPI from './useAPI'
import useSessao from './useSessao'
import { EVENTO_ATENDIMENTOS_ATUALIZADOS } from '../atendimentos/operacao'

export interface NotificacaoUsuario { id: number; tipo: string; titulo: string; mensagem: string; acaoUrl?: string | null; lidaEm?: string | null; createdAt: string }
const INTERVALO_ATUALIZACAO_MS = 5_000

export default function useNotificacoes() {
    const { httpGet, httpPut } = useAPI()
    const { usuario, renovarSessao } = useSessao()
    const [itens, setItens] = useState<NotificacaoUsuario[]>([])
    const [erro, setErro] = useState('')
    const carregar = useCallback(async () => {
        if (!usuario?.id) return
        try {
            const resposta = await httpGet('/notificacoes')
            if (!Array.isArray(resposta)) throw new Error(resposta?.message ?? 'Não foi possível atualizar as notificações.')
            setItens(resposta); setErro('')
            const responsavel = usuario?.papel === 'ESTABLISHMENT_OWNER' || usuario?.role === 'ESTABLISHMENT_OWNER'
            if (!responsavel && resposta.some((item) => item.tipo === 'SOLICITACAO_APPROVED' && !item.lidaEm)) await renovarSessao()
        } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível atualizar as notificações.') }
    }, [httpGet, renovarSessao, usuario?.id, usuario?.papel, usuario?.role])
    useEffect(() => {
        carregar()
        const intervalo = window.setInterval(() => { if (document.visibilityState === 'visible') void carregar() }, INTERVALO_ATUALIZACAO_MS)
        const atualizarAoRetornar = () => { if (document.visibilityState === 'visible') carregar() }
        document.addEventListener('visibilitychange', atualizarAoRetornar)
        window.addEventListener('focus', carregar)
        window.addEventListener(EVENTO_ATENDIMENTOS_ATUALIZADOS, carregar)
        return () => {
            window.clearInterval(intervalo)
            document.removeEventListener('visibilitychange', atualizarAoRetornar)
            window.removeEventListener('focus', carregar)
            window.removeEventListener(EVENTO_ATENDIMENTOS_ATUALIZADOS, carregar)
        }
    }, [carregar])
    async function ler(id: number) { try { const resposta = await httpPut(`/notificacoes/${id}/ler`, {}); if (resposta?.statusCode) throw new Error(resposta.message); await carregar() } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível marcar a notificação.') } }
    async function lerTodas() { try { const resposta = await httpPut('/notificacoes/ler-todas', {}); if (resposta?.statusCode) throw new Error(resposta.message); await carregar() } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível marcar as notificações.') } }
    return { itens, naoLidas: itens.filter((item) => !item.lidaEm).length, carregar, ler, lerTodas, erro }
}
