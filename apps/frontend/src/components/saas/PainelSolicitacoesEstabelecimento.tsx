'use client'
import { useCallback, useEffect, useState } from 'react'
import useAPI from '@/data/hooks/useAPI'

interface Solicitacao {
    id: number; nomePublico: string; tipoEstabelecimento: string; modeloAtendimento: string
    cep?: string; logradouro?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; estado?: string
    usuario: { nome: string; email: string }; segmentos: Array<{ segmento: { nome: string } }>
    possiveisDuplicidades?: Array<{ id: number; nome: string; slug: string }>
}
interface Coordenadas { latitude: number; longitude: number; origem: string; mapsUrl: string }
const INTERVALO_ATUALIZACAO_MS = 15_000

export default function PainelSolicitacoesEstabelecimento() {
    const { httpGet, httpPost, httpPut } = useAPI()
    const [itens, setItens] = useState<Solicitacao[]>([])
    const [mensagem, setMensagem] = useState('')
    const carregar = useCallback(async () => {
        const resposta = await httpGet('/admin/solicitacoes-estabelecimento')
        setItens(Array.isArray(resposta) ? resposta : [])
    }, [httpGet])
    useEffect(() => {
        carregar()
        const intervalo = window.setInterval(carregar, INTERVALO_ATUALIZACAO_MS)
        const atualizarAoRetornar = () => { if (document.visibilityState === 'visible') carregar() }
        document.addEventListener('visibilitychange', atualizarAoRetornar)
        return () => { window.clearInterval(intervalo); document.removeEventListener('visibilitychange', atualizarAoRetornar) }
    }, [carregar])

    async function revisar(item: Solicitacao, acao: 'aprovar' | 'solicitar-correcao' | 'reprovar', coordenadas?: Coordenadas) {
        const motivo = acao === 'aprovar' ? undefined : window.prompt(acao === 'reprovar' ? 'Motivo da reprovação:' : 'Quais dados devem ser corrigidos?')
        if (acao !== 'aprovar' && !motivo?.trim()) return
        if (acao === 'aprovar' && item.modeloAtendimento !== 'DOMICILIAR' && !coordenadas) return setMensagem('Valide o endereço no mapa antes de aprovar.')
        const resposta: any = await httpPut(`/admin/solicitacoes-estabelecimento/${item.id}/${acao}`, { motivo, latitude: coordenadas?.latitude, longitude: coordenadas?.longitude })
        setMensagem(resposta?.statusCode ? resposta.message : 'Solicitação revisada com sucesso.'); await carregar()
    }
    async function resolver(item: Solicitacao, googleMapsUrl?: string) {
        const resposta: any = await httpPost(`/admin/solicitacoes-estabelecimento/${item.id}/resolver-coordenadas`, { googleMapsUrl })
        if (resposta?.statusCode) throw new Error(resposta.message || 'Não foi possível localizar o endereço.')
        return resposta as Coordenadas
    }

    return <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4"><h2 className="text-xl font-bold">Solicitações de novos estabelecimentos</h2><p className="text-sm text-slate-500">{itens.length} aguardando análise</p></div>
        {mensagem ? <p className="mb-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">{mensagem}</p> : null}
        <div className="space-y-3">{itens.length ? itens.map((item) => <CartaoSolicitacao key={item.id} item={item} resolver={resolver} revisar={revisar} setMensagem={setMensagem} />) : <p className="py-5 text-center text-slate-500">Nenhuma solicitação pendente.</p>}</div>
    </section>
}

function CartaoSolicitacao({ item, resolver, revisar, setMensagem }: {
    item: Solicitacao; resolver: (item: Solicitacao, url?: string) => Promise<Coordenadas>
    revisar: (item: Solicitacao, acao: 'aprovar' | 'solicitar-correcao' | 'reprovar', coordenadas?: Coordenadas) => Promise<void>
    setMensagem: (mensagem: string) => void
}) {
    const [googleMapsUrl, setGoogleMapsUrl] = useState('')
    const [coordenadas, setCoordenadas] = useState<Coordenadas>()
    const [resolvendo, setResolvendo] = useState(false)
    const endereco = [item.logradouro, item.numero, item.complemento, item.bairro, item.cidade, item.estado, item.cep].filter(Boolean).join(', ')
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`
    async function validarLocalizacao() {
        try {
            setResolvendo(true); setMensagem('')
            setCoordenadas(await resolver(item, googleMapsUrl.trim() || undefined))
            setMensagem('Localização encontrada. Confira o ponto no Google Maps antes de aprovar.')
        } catch (erro: any) { setMensagem(erro?.message || 'Não foi possível localizar o endereço.') }
        finally { setResolvendo(false) }
    }
    return <article className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{item.nomePublico}</h3><p className="text-sm text-slate-500">{item.tipoEstabelecimento} · {item.modeloAtendimento} · {item.segmentos.map(s => s.segmento.nome).join(', ')}</p><p className="mt-1 text-sm">Responsável: {item.usuario.nome} ({item.usuario.email})</p><p className="text-sm">{endereco}</p></div>
            {endereco ? <a className="text-sm font-semibold text-indigo-500" target="_blank" rel="noreferrer" href={coordenadas?.mapsUrl || mapsUrl}>Abrir no Google Maps</a> : null}</div>
        {item.possiveisDuplicidades?.length ? <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Possível duplicidade: {item.possiveisDuplicidades.map(d => `${d.nome} (#${d.id})`).join(', ')}</p> : null}
        {item.modeloAtendimento !== 'DOMICILIAR' ? <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <label className="text-sm font-semibold">URL do Google Maps <span className="font-normal text-slate-500">(opcional)</span></label>
            <div className="mt-2 flex flex-wrap gap-2"><input value={googleMapsUrl} onChange={(evento) => setGoogleMapsUrl(evento.target.value)} placeholder="Cole a URL do ponto exato ou use o endereço cadastrado" className="min-w-64 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" />
                <button disabled={resolvendo} onClick={validarLocalizacao} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{resolvendo ? 'Localizando...' : 'Preencher coordenadas'}</button></div>
            {coordenadas ? <p className="mt-2 text-sm font-semibold text-emerald-700">Localização validada: {coordenadas.latitude.toFixed(6)}, {coordenadas.longitude.toFixed(6)}</p> : <p className="mt-2 text-xs text-slate-500">O sistema extrai o ponto da URL ou localiza automaticamente pelo endereço completo.</p>}
        </div> : null}
        <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => revisar(item, 'aprovar', coordenadas)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Aprovar</button><button onClick={() => revisar(item, 'solicitar-correcao')} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white">Solicitar correção</button><button onClick={() => revisar(item, 'reprovar')} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Reprovar</button></div>
    </article>
}
