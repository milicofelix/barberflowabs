'use client'
import type { Profissional, Servico } from '@uniflowabs/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import useAPI from './useAPI'

export type TipoCatalogo = 'servicos' | 'profissionais'
export type ItemCatalogo = (Servico | Profissional) & { estabelecimento: { id: number; nome: string; slug: string } }
interface RespostaCatalogo { itens: ItemCatalogo[]; paginacao: { pagina: number; total: number; limite: number; paginas: number } }

export default function useCatalogoPublico(tipo: TipoCatalogo, vitrine: boolean, segmento: string, q: string, pagina: number) {
    const { httpGet } = useAPI()
    const [resposta, setResposta] = useState<RespostaCatalogo | null>(null)
    const [carregando, setCarregando] = useState(true); const [erro, setErro] = useState('')
    const requisicao = useRef(0)
    const carregar = useCallback(async () => {
        const ticket = ++requisicao.current
        setCarregando(true); setErro('')
        try {
            const parametros = new URLSearchParams({ vitrine: String(vitrine), pagina: String(pagina), limite: vitrine ? '6' : '12' })
            if (q.trim()) parametros.set('q', q.trim())
            if (segmento) parametros.set('segmento', segmento)
            const dados = await httpGet(`/public/catalogo/${tipo}?${parametros}`)
            if (!Array.isArray(dados?.itens) || !dados?.paginacao) throw new Error(dados?.message ?? 'Não foi possível carregar o catálogo.')
            if (ticket === requisicao.current) setResposta(dados)
        } catch (e) { if (ticket === requisicao.current) { setResposta(null); setErro(e instanceof Error ? e.message : 'Não foi possível carregar o catálogo.') } }
        finally { if (ticket === requisicao.current) setCarregando(false) }
    }, [httpGet, pagina, q, segmento, tipo, vitrine])
    useEffect(() => {
        setCarregando(true)
        const timer = window.setTimeout(() => { void carregar() }, q ? 300 : 0)
        return () => { window.clearTimeout(timer); requisicao.current++ }
    }, [carregar, q])
    return { resposta, carregando, erro, carregar }
}
