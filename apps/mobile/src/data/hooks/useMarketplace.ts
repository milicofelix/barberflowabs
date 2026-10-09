import type { CategoriaMarketplace, ResultadoMarketplace } from '../barbearias/tipos'
import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface FiltrosMarketplace {
    busca: string
    cidade: string
    segmento: string
    especialidade: string
    precoMax: string
    notaMin: number
    abertaAgora: boolean
    disponivelEm: string
    posicao: { lat: number; lng: number } | null
    raioKm: number
}

export const FILTROS_INICIAIS: FiltrosMarketplace = {
    busca: '', cidade: '', segmento: '', especialidade: '', precoMax: '', notaMin: 0,
    abertaAgora: false, disponivelEm: '', posicao: null, raioKm: 10,
}

export default function useMarketplace(filtros: FiltrosMarketplace) {
    const { httpGet } = useAPI()
    const [resultado, setResultado] = useState<ResultadoMarketplace>({ itens: [], paginacao: { pagina: 1, limite: 20, total: 0, paginas: 0 } })
    const [categorias, setCategorias] = useState<CategoriaMarketplace[]>([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const query = useMemo(() => montarQuery(filtros), [filtros])

    const carregar = useCallback(async () => {
        try {
            setCarregando(true); setErro(null)
            setResultado(await httpGet<ResultadoMarketplace>(`/public/marketplace${query}`, { escopoTenant: 'nenhum' }))
        } catch (e) {
            setResultado({ itens: [], paginacao: { pagina: 1, limite: 20, total: 0, paginas: 0 } })
            setErro(mensagemDoErro(e))
        } finally { setCarregando(false) }
    }, [httpGet, query])

    useEffect(() => {
        httpGet<CategoriaMarketplace[]>('/public/marketplace/categorias', { escopoTenant: 'nenhum' })
            .then(setCategorias).catch(() => setCategorias([]))
    }, [httpGet])
    useEffect(() => { const timer = setTimeout(carregar, 350); return () => clearTimeout(timer) }, [carregar])
    return { ...resultado, categorias, carregando, erro, recarregar: carregar }
}

function montarQuery(filtros: FiltrosMarketplace) {
    const params: Array<[string, string | number]> = []
    const adicionar = (nome: string, valor: string | number | undefined) => {
        if (valor !== undefined && String(valor).trim()) params.push([nome, valor])
    }
    adicionar('q', filtros.busca.trim()); adicionar('cidade', filtros.cidade.trim())
    adicionar('segmento', filtros.segmento); adicionar('especialidade', filtros.especialidade)
    adicionar('precoMax', filtros.precoMax); adicionar('notaMin', filtros.notaMin || undefined)
    adicionar('disponivelEm', filtros.disponivelEm); if (filtros.abertaAgora) adicionar('abertaAgora', 'true')
    if (filtros.posicao) {
        adicionar('lat', filtros.posicao.lat); adicionar('lng', filtros.posicao.lng); adicionar('raioKm', filtros.raioKm)
    }
    return params.length ? `?${params.map(([nome, valor]) => `${nome}=${encodeURIComponent(valor)}`).join('&')}` : ''
}
