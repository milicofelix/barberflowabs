'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const URL_BASE = process.env.NEXT_PUBLIC_API_URL

export default function PerfilPublicoBarbearia({ slug }: { slug: string }) {
    const [barbearia, setBarbearia] = useState<any>(null)
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState('')

    const carregar = useCallback(async function carregar() {
        try {
            setCarregando(true)
            setErro('')
            const resposta = await fetch(`${URL_BASE}/public/barbearias/${slug}`)
            const dados = await resposta.json()

            if (!resposta.ok) {
                setErro(dados?.message ?? 'Barbearia não encontrada')
                setBarbearia(null)
                return
            }

            setBarbearia(dados)
        } catch (e) {
            setErro('Não foi possível carregar a barbearia.')
            setBarbearia(null)
        } finally {
            setCarregando(false)
        }
    }, [slug])

    useEffect(() => {
        carregar()
    }, [carregar])

    if (carregando) {
        return <div className="container py-10 text-zinc-300">Carregando barbearia...</div>
    }

    if (erro || !barbearia) {
        return <div className="container py-10 text-zinc-300">{erro || 'Barbearia não encontrada.'}</div>
    }

    const endereco = [
        barbearia.endereco?.logradouro,
        barbearia.endereco?.bairro,
        barbearia.endereco?.cidade,
        barbearia.endereco?.estado,
    ].filter(Boolean).join(' - ')

    return (
        <div className="bg-zinc-950 text-zinc-100">
            <section
                className="min-h-[420px] bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.88), rgba(0,0,0,.46)), url(${barbearia.imagemCapaURL || '/banners/principal.webp'})` }}
            >
                <div className="container flex min-h-[420px] flex-col justify-end gap-5 py-10">
                    <span className={statusClasse(barbearia.statusOperacional?.status)}>
                        {barbearia.statusOperacional?.label ?? 'Status indisponível'}
                    </span>
                    <div>
                        <h1 className="max-w-4xl text-5xl font-black text-white">{barbearia.nome}</h1>
                        <p className="mt-4 max-w-2xl text-lg text-zinc-300">{barbearia.descricao}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
                        {barbearia.avaliacaoMedia != null && (
                            <span className="inline-flex items-center gap-1 rounded border border-yellow-400/50 px-3 py-2 text-yellow-300">
                                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                {barbearia.avaliacaoMedia} ({barbearia.quantidadeAvaliacoes} avaliações)
                            </span>
                        )}
                        {endereco && <span className="rounded border border-zinc-700 px-3 py-2">{endereco}</span>}
                        {barbearia.telefone && <span className="rounded border border-zinc-700 px-3 py-2">{barbearia.telefone}</span>}
                    </div>
                    {barbearia.aceitaAgendamentoOnline && (
                        <Link
                            href={`/agendamento?barbearia=${barbearia.slug}`}
                            className="w-fit rounded bg-yellow-400 px-5 py-3 font-bold text-black"
                        >
                            Agendar horário
                        </Link>
                    )}
                </div>
            </section>

            <div className="container grid gap-8 py-10">
                <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
                    <ListaServicos servicos={barbearia.servicos ?? []} />
                    <Horarios horarios={barbearia.horariosFuncionamento ?? []} />
                </section>
                <ListaProfissionais profissionais={barbearia.profissionais ?? []} />
                <ListaAvaliacoes avaliacoes={barbearia.avaliacoes ?? []} />
            </div>
        </div>
    )
}

function ListaServicos({ servicos }: { servicos: any[] }) {
    return (
        <section>
            <h2 className="text-2xl font-black">Serviços</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                {servicos.map((servico) => (
                    <div key={servico.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
                        <h3 className="font-bold">{servico.nome}</h3>
                        <p className="mt-2 text-sm text-zinc-400">{servico.descricao}</p>
                        <p className="mt-3 text-sm text-zinc-300">
                            {moeda(servico.preco)} | {servico.duracaoMinutos} min
                        </p>
                    </div>
                ))}
                {servicos.length === 0 && <Vazio texto="Esta barbearia ainda não cadastrou serviços." />}
            </div>
        </section>
    )
}

function ListaProfissionais({ profissionais }: { profissionais: any[] }) {
    return (
        <section>
            <h2 className="text-2xl font-black">Profissionais</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {profissionais.map((profissional) => (
                    <div key={profissional.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
                        <h3 className="font-bold">{profissional.nome}</h3>
                        <p className="mt-2 text-sm text-zinc-400">{profissional.descricao}</p>
                        <p className="mt-3 text-sm text-zinc-300">
                            {Number(profissional.avaliacao ?? 0).toFixed(1)} | {profissional.quantidadeAvaliacoes ?? 0} avaliações
                        </p>
                    </div>
                ))}
                {profissionais.length === 0 && <Vazio texto="Esta barbearia ainda não cadastrou profissionais." />}
            </div>
        </section>
    )
}

function Horarios({ horarios }: { horarios: any[] }) {
    return (
        <section className="rounded border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-2xl font-black">Horários</h2>
            <div className="mt-4 grid gap-2 text-sm text-zinc-300">
                {horarios.map((horario) => (
                    <p key={horario.diaSemana} className="flex justify-between gap-3 border-b border-zinc-800 pb-2">
                        <span>{diaSemana(horario.diaSemana)}</span>
                        <strong>
                            {horario.inicio} às {horario.fim}
                        </strong>
                    </p>
                ))}
                {horarios.length === 0 && <Vazio texto="Horários ainda não configurados." />}
            </div>
        </section>
    )
}

function ListaAvaliacoes({ avaliacoes }: { avaliacoes: any[] }) {
    return (
        <section>
            <h2 className="text-2xl font-black">Avaliações</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {avaliacoes.map((avaliacao) => (
                    <article key={avaliacao.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
                        <p className="inline-flex items-center gap-1 text-sm font-bold text-yellow-300">
                            <Star size={15} className="fill-yellow-400 text-yellow-400" />
                            {avaliacao.nota}
                        </p>
                        <p className="mt-3 text-sm text-zinc-300">{avaliacao.comentario || 'Cliente não deixou comentário.'}</p>
                        <p className="mt-3 text-xs text-zinc-500">
                            {avaliacao.cliente ?? 'Cliente'} | {avaliacao.profissional ?? 'Profissional'}
                        </p>
                    </article>
                ))}
                {avaliacoes.length === 0 && <Vazio texto="Esta barbearia ainda não possui avaliações." />}
            </div>
        </section>
    )
}

function Vazio({ texto }: { texto: string }) {
    return <p className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">{texto}</p>
}

function statusClasse(status: string) {
    const base = 'w-fit rounded px-3 py-2 text-sm font-bold'
    if (status === 'ABERTA') return `${base} bg-emerald-500 text-white`
    if (status === 'ABRE_EM_BREVE' || status === 'INTERVALO') return `${base} bg-yellow-400 text-black`
    return `${base} bg-zinc-800 text-zinc-200`
}

function moeda(valor: any) {
    return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function diaSemana(dia: number) {
    return ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dia] ?? '-'
}
