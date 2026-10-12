'use client'
import { useCallback, useEffect, useState } from 'react'
import useAPI from '@/data/hooks/useAPI'

interface Solicitacao { id: number; nomePublico: string; tipoEstabelecimento: string; modeloAtendimento: string; logradouro?: string; numero?: string; bairro?: string; cidade?: string; estado?: string; enviadoEm: string; usuario: { nome: string; email: string }; segmentos: Array<{ segmento: { nome: string } }>; possiveisDuplicidades?: Array<{ id: number; nome: string; slug: string }> }
const INTERVALO_ATUALIZACAO_MS = 15_000

export default function PainelSolicitacoesEstabelecimento() {
    const { httpGet, httpPut } = useAPI(); const [itens, setItens] = useState<Solicitacao[]>([]); const [mensagem, setMensagem] = useState('')
    const carregar = useCallback(async () => { const resposta = await httpGet('/admin/solicitacoes-estabelecimento'); setItens(Array.isArray(resposta) ? resposta : []) }, [httpGet])
    useEffect(() => {
        carregar()
        const intervalo = window.setInterval(carregar, INTERVALO_ATUALIZACAO_MS)
        const atualizarAoRetornar = () => { if (document.visibilityState === 'visible') carregar() }
        document.addEventListener('visibilitychange', atualizarAoRetornar)
        return () => { window.clearInterval(intervalo); document.removeEventListener('visibilitychange', atualizarAoRetornar) }
    }, [carregar])
    async function revisar(item: Solicitacao, acao: 'aprovar' | 'solicitar-correcao' | 'reprovar') {
        const motivo = acao === 'aprovar' ? undefined : window.prompt(acao === 'reprovar' ? 'Motivo da reprovação:' : 'Quais dados devem ser corrigidos?')
        if (acao !== 'aprovar' && !motivo?.trim()) return
        let coordenadas = {}
        if (acao === 'aprovar' && item.modeloAtendimento !== 'DOMICILIAR') {
            const latitude = window.prompt('Latitude validada pelo superadmin:')?.replace(',', '.')
            const longitude = window.prompt('Longitude validada pelo superadmin:')?.replace(',', '.')
            if (!latitude || !longitude || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
                return setMensagem('Informe latitude e longitude válidas para aprovar.')
            }
            coordenadas = { latitude: Number(latitude), longitude: Number(longitude) }
        }
        const resposta: any = await httpPut(`/admin/solicitacoes-estabelecimento/${item.id}/${acao}`, { motivo, ...coordenadas })
        setMensagem(resposta?.statusCode ? resposta.message : 'Solicitação revisada com sucesso.'); await carregar()
    }
    return <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4"><h2 className="text-xl font-bold">Solicitações de novos estabelecimentos</h2><p className="text-sm text-slate-500">{itens.length} aguardando análise</p></div>
        {mensagem ? <p className="mb-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">{mensagem}</p> : null}
        <div className="space-y-3">{itens.length ? itens.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{item.nomePublico}</h3><p className="text-sm text-slate-500">{item.tipoEstabelecimento} · {item.modeloAtendimento} · {item.segmentos.map(s => s.segmento.nome).join(', ')}</p><p className="mt-1 text-sm">Responsável: {item.usuario.nome} ({item.usuario.email})</p><p className="text-sm">{[item.logradouro, item.numero, item.bairro, item.cidade, item.estado].filter(Boolean).join(', ')}</p></div>
                <a className="text-sm text-indigo-500" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([item.logradouro, item.numero, item.bairro, item.cidade, item.estado].filter(Boolean).join(', '))}`}>Validar endereço</a></div>
            {item.possiveisDuplicidades?.length ? <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Possível duplicidade: {item.possiveisDuplicidades.map(d => `${d.nome} (#${d.id})`).join(', ')}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => revisar(item, 'aprovar')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Aprovar</button><button onClick={() => revisar(item, 'solicitar-correcao')} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white">Solicitar correção</button><button onClick={() => revisar(item, 'reprovar')} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white">Reprovar</button></div>
        </article>) : <p className="py-5 text-center text-slate-500">Nenhuma solicitação pendente.</p>}</div>
    </section>
}
