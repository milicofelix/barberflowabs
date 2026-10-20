'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import useAPI from './useAPI'
import useSessao from './useSessao'
import { EVENTO_ATENDIMENTOS_ATUALIZADOS, intervaloDiaAtendimento, type AcaoAtendimento, type AtendimentoOperacional } from '../atendimentos/operacao'

export default function useAtendimentosOperacionais(modo: 'home' | 'agenda', data?: string, selecionadoId?: number | null) {
    const { httpGet, httpPut } = useAPI(); const { usuario } = useSessao()
    const [itens, setItens] = useState<AtendimentoOperacional[]>([])
    const [selecionado, setSelecionado] = useState<AtendimentoOperacional | null>(null)
    const [carregando, setCarregando] = useState(true); const [erro, setErro] = useState('')
    const [erroAcao, setErroAcao] = useState('')
    const [processando, setProcessando] = useState<number | null>(null); const [mensagem, setMensagem] = useState('')
    const [agora, setAgora] = useState(Date.now())
    const requisicao = useRef(0)
    const acaoEmAndamento = useRef(false)
    const fuso = useRef<string | null>(null)
    useEffect(() => { fuso.current = null }, [usuario?.estabelecimentoId])

    const carregar = useCallback(async () => {
        const atual = ++requisicao.current
        try {
            let lista: AtendimentoOperacional[] = []
            if (modo === 'home') {
                const resposta = await httpGet('/gestao/atendimentos/home')
                if (!Array.isArray(resposta)) throw new Error(resposta?.message ?? 'Não foi possível carregar os atendimentos.')
                lista = resposta
            } else {
                if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) throw new Error('Selecione uma data válida.')
                if (!fuso.current) {
                    const contexto = await httpGet('/gestao/agendamentos/contexto')
                    if (atual !== requisicao.current) return false
                    if (contexto?.statusCode) throw new Error(contexto.message)
                    fuso.current = contexto?.fusoHorario ?? 'America/Sao_Paulo'
                }
                const periodo = intervaloDiaAtendimento(data, fuso.current ?? 'America/Sao_Paulo')
                const parametros = new URLSearchParams({ ...periodo, limite: '200' })
                const cursores = new Set<string>()
                while (true) {
                    const resposta = await httpGet(`/gestao/agenda?${parametros}`)
                    if (!Array.isArray(resposta?.itens)) throw new Error(resposta?.message ?? 'Não foi possível carregar a agenda.')
                    lista.push(...resposta.itens)
                    const cursor = resposta.pagina?.proximoCursor
                    if (!resposta.pagina?.temMais || !cursor || cursores.has(cursor)) break
                    cursores.add(cursor); parametros.set('cursor', cursor)
                }
            }
            let detalhe = selecionadoId ? lista.find((item) => item.id === selecionadoId) ?? null : null
            let falhaDetalhe = ''
            if (selecionadoId && !detalhe) {
                const resposta = await httpGet(`/gestao/agendamentos/${selecionadoId}`)
                if (resposta?.id === selecionadoId && !resposta?.statusCode) detalhe = resposta
                else falhaDetalhe = resposta?.message ?? 'Atendimento não encontrado nesta unidade.'
            }
            if (atual !== requisicao.current) return
            setItens(Array.from(new Map(lista.map((item) => [item.id, item])).values()))
            setSelecionado(detalhe); setErro(falhaDetalhe)
            return true
        } catch (e) {
            if (atual === requisicao.current) setErro(e instanceof Error ? e.message : 'Não foi possível atualizar os atendimentos.')
            return false
        } finally { if (atual === requisicao.current) setCarregando(false) }
    }, [data, httpGet, modo, selecionadoId])

    useEffect(() => {
        let vivo = true; let sincronizando = false; let revisao: number | null = null; let ultimoCarregamento = 0
        setItens([]); setSelecionado(null); setCarregando(true); setErro('')
        async function sincronizar(forcar = false) {
            if (!vivo || sincronizando || (!forcar && document.visibilityState === 'hidden')) return
            sincronizando = true
            try {
                const resposta = await httpGet('/gestao/agenda/revisao')
                if (!vivo) return
                if (forcar || (typeof resposta?.revisao === 'number' && resposta.revisao !== revisao) || Date.now() - ultimoCarregamento >= 60_000) {
                    if (await carregar()) {
                        if (typeof resposta?.revisao === 'number') revisao = resposta.revisao
                        ultimoCarregamento = Date.now()
                    }
                }
            } catch (e) { if (vivo) { setErro(e instanceof Error ? e.message : 'Não foi possível sincronizar a agenda.'); setCarregando(false) } }
            finally { sincronizando = false }
        }
        void sincronizar(true)
        const intervalo = window.setInterval(() => { setAgora(Date.now()); void sincronizar() }, 5_000)
        const retornar = () => { if (document.visibilityState === 'visible') void sincronizar(true) }
        window.addEventListener('focus', retornar); document.addEventListener('visibilitychange', retornar)
        window.addEventListener(EVENTO_ATENDIMENTOS_ATUALIZADOS, retornar)
        return () => {
            vivo = false; requisicao.current++; window.clearInterval(intervalo)
            window.removeEventListener('focus', retornar); document.removeEventListener('visibilitychange', retornar)
            window.removeEventListener(EVENTO_ATENDIMENTOS_ATUALIZADOS, retornar)
        }
    }, [carregar, httpGet, usuario?.estabelecimentoId])

    async function executar(item: AtendimentoOperacional, acao: AcaoAtendimento, motivo: string) {
        if (acaoEmAndamento.current) return false
        acaoEmAndamento.current = true
        setProcessando(item.id); setMensagem(''); setErroAcao('')
        try {
            const retomar = acao === 'RETOMAR_AUTOMACAO'
            const resposta = await httpPut(`/gestao/agendamentos/${item.id}/${retomar ? 'retomar-automacao' : 'status'}`, retomar ? {} : { status: acao, motivo: motivo.trim() || null })
            if (!resposta || resposta.statusCode !== undefined) throw new Error(resposta?.message ?? 'Não foi possível atualizar o atendimento.')
            await carregar()
            setMensagem(retomar ? 'Automação retomada.' : 'Atendimento atualizado.')
            window.dispatchEvent(new Event(EVENTO_ATENDIMENTOS_ATUALIZADOS))
            return true
        } catch (e) {
            await carregar()
            setErroAcao(e instanceof Error ? e.message : 'Não foi possível atualizar o atendimento.')
            return false
        } finally { acaoEmAndamento.current = false; setProcessando(null) }
    }
    return { itens, selecionado, carregando, erro: erroAcao || erro, processando, mensagem, agora, carregar, executar, limparErroAcao: () => setErroAcao('') }
}
