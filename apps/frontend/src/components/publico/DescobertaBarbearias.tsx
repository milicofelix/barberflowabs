'use client'

import Link from 'next/link'
import { ListFilter, LocateFixed, Search, Star } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import MapaLeafletBarbearias from './MapaLeafletBarbearias'

const URL_BASE = process.env.NEXT_PUBLIC_API_URL
const RAIOS = [2, 5, 10, 25]

export default function DescobertaBarbearias() {
    const [barbearias, setBarbearias] = useState<any[]>([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState('')
    const [q, setQ] = useState('')
    const [cidade, setCidade] = useState('')
    const [estado, setEstado] = useState('')
    const [servico, setServico] = useState('')
    const [raioKm, setRaioKm] = useState(10)
    const [abertaAgora, setAbertaAgora] = useState(false)
    const [modo, setModo] = useState<'lista' | 'mapa'>('lista')
    const [posicao, setPosicao] = useState<{ lat: number; lng: number } | null>(null)
    const [localizando, setLocalizando] = useState(false)

    const parametros = useMemo(() => {
        const params = new URLSearchParams()
        if (q.trim()) params.set('q', q.trim())
        if (cidade.trim()) params.set('cidade', cidade.trim())
        if (estado.trim()) params.set('estado', estado.trim())
        if (servico.trim()) params.set('servico', servico.trim())
        if (abertaAgora) params.set('abertaAgora', 'true')
        params.set('raioKm', String(raioKm))
        if (posicao) {
            params.set('lat', String(posicao.lat))
            params.set('lng', String(posicao.lng))
        }
        return params
    }, [abertaAgora, cidade, estado, posicao, q, raioKm, servico])

    const carregar = useCallback(async function carregar() {
        try {
            setCarregando(true)
            setErro('')
            const resposta = await fetch(`${URL_BASE}/public/barbearias?${parametros.toString()}`)
            const dados = await resposta.json()

            if (!resposta.ok) {
                setErro(dados?.message ?? 'Não foi possível carregar as barbearias.')
                setBarbearias([])
                return
            }

            setBarbearias(Array.isArray(dados) ? dados : [])
        } catch (e) {
            setErro('Não foi possível carregar as barbearias.')
            setBarbearias([])
        } finally {
            setCarregando(false)
        }
    }, [parametros])

    useEffect(() => {
        carregar()
    }, [carregar])

    function usarMinhaLocalizacao() {
        if (!navigator.geolocation) {
            setErro('Seu navegador não liberou localização.')
            return
        }

        setLocalizando(true)
        navigator.geolocation.getCurrentPosition(
            (coordenadas) => {
                setPosicao({
                    lat: coordenadas.coords.latitude,
                    lng: coordenadas.coords.longitude,
                })
                setLocalizando(false)
            },
            () => {
                setErro('Não foi possível obter sua localização.')
                setLocalizando(false)
            },
            { enableHighAccuracy: true, timeout: 8000 },
        )
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-zinc-100">
            <section
                className="bg-cover bg-center"
                style={{ backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,.92), rgba(0,0,0,.58)), url(/banners/principal.png)' }}
            >
                <div className="container flex min-h-[340px] flex-col justify-end gap-5 py-10">
                    <span className="w-fit rounded border border-yellow-400/50 px-3 py-2 text-sm font-bold text-yellow-300">
                        Barbearias aprovadas
                    </span>
                    <div>
                        <h1 className="max-w-4xl text-4xl font-black text-white md:text-5xl">Encontre uma barbearia perto de você</h1>
                        <p className="mt-4 max-w-2xl text-lg text-zinc-300">
                            Compare distância, serviços, status de funcionamento e escolha onde agendar.
                        </p>
                    </div>
                </div>
            </section>

            <section className="container grid gap-6 py-8">
                <div className="grid gap-3 rounded border border-zinc-800 bg-zinc-900 p-4">
                    <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr_.45fr]">
                        <CampoBusca icone={<Search size={18} />} valor={q} onChange={setQ} placeholder="Nome, bairro ou cidade" />
                        <CampoBusca icone={<ListFilter size={18} />} valor={servico} onChange={setServico} placeholder="Serviço desejado" />
                        <CampoBusca valor={estado} onChange={setEstado} placeholder="UF" />
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                        <CampoBusca valor={cidade} onChange={setCidade} placeholder="Cidade" />
                        <div className="flex flex-wrap items-center gap-2">
                            {RAIOS.map((raio) => (
                                <button
                                    key={raio}
                                    type="button"
                                    onClick={() => setRaioKm(raio)}
                                    className={`h-10 rounded border px-3 text-sm font-bold ${
                                        raioKm === raio ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-zinc-700 text-zinc-300'
                                    }`}
                                >
                                    {raio} km
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setAbertaAgora(!abertaAgora)}
                                className={`h-10 rounded border px-3 text-sm font-bold ${
                                    abertaAgora ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-zinc-700 text-zinc-300'
                                }`}
                            >
                                Aberta agora
                            </button>
                            <button
                                type="button"
                                onClick={usarMinhaLocalizacao}
                                className="inline-flex h-10 items-center gap-2 rounded border border-zinc-700 px-3 text-sm font-bold text-zinc-200"
                            >
                                <LocateFixed size={18} />
                                {localizando ? 'Localizando...' : 'Minha localização'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-zinc-400">
                        {carregando ? 'Buscando...' : `${barbearias.length} barbearia${barbearias.length === 1 ? '' : 's'} encontrada${barbearias.length === 1 ? '' : 's'}`}
                    </p>
                    <div className="flex w-fit rounded border border-zinc-800 bg-zinc-900 p-1">
                        <button type="button" onClick={() => setModo('lista')} className={abaClasse(modo === 'lista')}>
                            Lista
                        </button>
                        <button type="button" onClick={() => setModo('mapa')} className={abaClasse(modo === 'mapa')}>
                            Mapa
                        </button>
                    </div>
                </div>

                {erro && <p className="rounded border border-red-900 bg-red-950/50 p-4 text-sm text-red-200">{erro}</p>}

                {modo === 'mapa' ? (
                    <MapaLeafletBarbearias barbearias={barbearias} posicaoUsuario={posicao} />
                ) : (
                    <ListaBarbearias barbearias={barbearias} carregando={carregando} />
                )}
            </section>
        </main>
    )
}

function ListaBarbearias({ barbearias, carregando }: { barbearias: any[]; carregando: boolean }) {
    if (carregando) {
        return <p className="rounded border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">Carregando barbearias...</p>
    }

    if (barbearias.length === 0) {
        return <p className="rounded border border-zinc-800 bg-zinc-900 p-6 text-zinc-300">Nenhuma barbearia encontrada.</p>
    }

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {barbearias.map((barbearia) => (
                <BarbeariaCard key={barbearia.id} barbearia={barbearia} />
            ))}
        </div>
    )
}

function BarbeariaCard({ barbearia }: { barbearia: any }) {
    const endereco = [barbearia.endereco?.bairro, barbearia.endereco?.cidade, barbearia.endereco?.estado].filter(Boolean).join(' - ')

    return (
        <article className="grid overflow-hidden rounded border border-zinc-800 bg-zinc-900 md:grid-cols-[180px_1fr]">
            <div className="min-h-[180px] bg-cover bg-center" style={{ backgroundImage: `url(${barbearia.imagemCapaURL || '/banners/principal.png'})` }} />
            <div className="grid gap-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-black text-white">{barbearia.nome}</h2>
                        <p className="mt-1 text-sm text-zinc-400">{endereco || 'Localização em atualização'}</p>
                    </div>
                    <span className={statusClasse(barbearia.statusOperacional?.status)}>
                        {barbearia.statusOperacional?.label ?? 'Status indisponível'}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-zinc-300">
                    {barbearia.distanciaKm !== null && <span className="rounded bg-zinc-800 px-2 py-1">{barbearia.distanciaKm} km</span>}
                    {barbearia.avaliacaoMedia != null && (
                        <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1">
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            {barbearia.avaliacaoMedia} ({barbearia.quantidadeAvaliacoes})
                        </span>
                    )}
                    {barbearia.destaque && <span className="rounded bg-yellow-400 px-2 py-1 font-bold text-black">Destaque</span>}
                </div>
                <p className="line-clamp-2 text-sm text-zinc-400">{barbearia.descricao || 'Perfil público em atualização.'}</p>
                <div className="flex flex-wrap gap-2">
                    {(barbearia.servicos ?? []).slice(0, 3).map((servico: any) => (
                        <span key={servico.id} className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                            {servico.nome}
                        </span>
                    ))}
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link href={`/barbearias/${barbearia.slug}`} className="rounded bg-yellow-400 px-4 py-2 text-sm font-bold text-black">
                        Ver perfil
                    </Link>
                    {barbearia.aceitaAgendamentoOnline && (
                        <Link href={`/agendamento?barbearia=${barbearia.slug}`} className="rounded border border-zinc-600 px-4 py-2 text-sm font-bold text-zinc-100">
                            Agendar
                        </Link>
                    )}
                </div>
            </div>
        </article>
    )
}

function CampoBusca({ valor, onChange, placeholder, icone }: { valor: string; onChange: (valor: string) => void; placeholder: string; icone?: any }) {
    return (
        <label className="flex h-11 items-center gap-2 rounded border border-zinc-700 bg-zinc-950 px-3 text-zinc-400">
            {icone}
            <input
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
        </label>
    )
}

function abaClasse(ativa: boolean) {
    return `h-9 rounded px-4 text-sm font-bold ${ativa ? 'bg-yellow-400 text-black' : 'text-zinc-300'}`
}

function statusClasse(status: string) {
    const base = 'rounded px-2 py-1 text-xs font-bold'
    if (status === 'ABERTA') return `${base} bg-emerald-500 text-white`
    if (status === 'ABRE_EM_BREVE' || status === 'INTERVALO') return `${base} bg-yellow-400 text-black`
    return `${base} bg-zinc-800 text-zinc-200`
}
