'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { salvarEstabelecimentoSelecionado } from '@/data/tenant/estabelecimentoSelecionado'
import { capaDoEstabelecimento } from '@/data/estabelecimentos/capas'
import Logo from '@/components/shared/Logo'

const URL_BASE = process.env.NEXT_PUBLIC_API_URL

export default function PerfilPublicoEstabelecimento({ slug }: { slug: string }) {
    const [estabelecimento, setEstabelecimento] = useState<any>(null)
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState('')
    const [denuncia, setDenuncia] = useState({
        nome: '',
        email: '',
        motivo: 'Dados incorretos',
        mensagem: '',
    })
    const [mensagemDenuncia, setMensagemDenuncia] = useState('')

    const carregar = useCallback(async function carregar() {
        try {
            setCarregando(true)
            setErro('')
            const resposta = await fetch(`${URL_BASE}/public/estabelecimentos/${slug}`)
            const dados = await resposta.json()

            if (!resposta.ok) {
                setErro(dados?.message ?? 'Estabelecimento não encontrado')
                setEstabelecimento(null)
                return
            }

            setEstabelecimento(dados)
        } catch (e) {
            setErro('Não foi possível carregar o estabelecimento.')
            setEstabelecimento(null)
        } finally {
            setCarregando(false)
        }
    }, [slug])

    useEffect(() => {
        salvarEstabelecimentoSelecionado(slug)
        carregar()
    }, [carregar, slug])

    async function enviarDenuncia() {
        setMensagemDenuncia('')

        try {
            const resposta = await fetch(`${URL_BASE}/public/estabelecimentos/${slug}/denuncias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(denuncia),
            })
            const dados = await resposta.json()

            if (!resposta.ok) {
                setMensagemDenuncia(dados?.message ?? 'Não foi possível enviar a denúncia.')
                return
            }

            setDenuncia({ nome: '', email: '', motivo: 'Dados incorretos', mensagem: '' })
            setMensagemDenuncia(dados?.mensagem ?? 'Denúncia recebida para revisão.')
        } catch (e) {
            setMensagemDenuncia('Não foi possível conectar à API.')
        }
    }

    if (carregando) {
        return <div className="container py-10 text-zinc-300">Carregando estabelecimento...</div>
    }

    if (erro || !estabelecimento) {
        return <div className="container py-10 text-zinc-300">{erro || 'Estabelecimento não encontrado.'}</div>
    }

    const endereco = [
        estabelecimento.endereco?.logradouro,
        estabelecimento.endereco?.bairro,
        estabelecimento.endereco?.cidade,
        estabelecimento.endereco?.estado,
    ].filter(Boolean).join(' - ')
    const capa = capaDoEstabelecimento(estabelecimento)

    return (
        <div className="bg-zinc-950 text-zinc-100">
            <section
                className="sobre-imagem min-h-[420px] bg-cover bg-center"
                style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.38)), url("${capa}")` }}
            >
                <div className="container flex min-h-[420px] flex-col justify-end gap-5 py-10">
                    {estabelecimento.logoModo === 'PERSONALIZADO' ? <Logo unidade={estabelecimento} /> : null}
                    <span className={statusClasse(estabelecimento.statusOperacional?.status)}>
                        {estabelecimento.statusOperacional?.label ?? 'Status indisponível'}
                    </span>
                    <div>
                        <h1 className="max-w-4xl text-5xl font-black text-white">{estabelecimento.nome}</h1>
                        <p className="mt-4 max-w-2xl text-lg text-zinc-300">{estabelecimento.descricao}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
                        {estabelecimento.avaliacaoMedia != null && (
                            <span className="inline-flex items-center gap-1 rounded border border-yellow-400/50 px-3 py-2 text-yellow-300">
                                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                                {estabelecimento.avaliacaoMedia} ({estabelecimento.quantidadeAvaliacoes} avaliações)
                            </span>
                        )}
                        {endereco && <span className="rounded border border-zinc-700 px-3 py-2">{endereco}</span>}
                        {estabelecimento.telefone && <span className="rounded border border-zinc-700 px-3 py-2">{estabelecimento.telefone}</span>}
                    </div>
                    {estabelecimento.aceitaAgendamentoOnline && (
                        <Link
                            href={`/agendamento?estabelecimento=${estabelecimento.slug}`}
                            className="w-fit rounded bg-yellow-400 px-5 py-3 font-bold text-black"
                        >
                            Agendar horário
                        </Link>
                    )}
                </div>
            </section>

            <div className="container grid gap-8 py-10">
                <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
                    <ListaServicos servicos={estabelecimento.servicos ?? []} />
                    <Horarios horarios={estabelecimento.horariosFuncionamento ?? []} />
                </section>
                <ListaProfissionais profissionais={estabelecimento.profissionais ?? []} />
                <ListaAvaliacoes avaliacoes={estabelecimento.avaliacoes ?? []} />
                <DenunciaPerfil
                    denuncia={denuncia}
                    mensagem={mensagemDenuncia}
                    onChange={(campo, valor) => setDenuncia((atual) => ({ ...atual, [campo]: valor }))}
                    onEnviar={enviarDenuncia}
                />
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
                {servicos.length === 0 && <Vazio texto="Este estabelecimento ainda não cadastrou serviços." />}
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
                {profissionais.length === 0 && <Vazio texto="Este estabelecimento ainda não cadastrou profissionais." />}
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
                {avaliacoes.length === 0 && <Vazio texto="Este estabelecimento ainda não possui avaliações." />}
            </div>
        </section>
    )
}

function DenunciaPerfil(props: {
    denuncia: any
    mensagem: string
    onChange: (campo: string, valor: string) => void
    onEnviar: () => void
}) {
    return (
        <section className="rounded border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-2xl font-black">Reportar perfil</h2>
            <p className="mt-2 text-sm text-zinc-400">
                Use este canal para avisar sobre dados incorretos, conteúdo inadequado ou problemas neste perfil público.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <CampoDenuncia label="Nome" value={props.denuncia.nome} onChange={(valor) => props.onChange('nome', valor)} />
                <CampoDenuncia label="E-mail" value={props.denuncia.email} onChange={(valor) => props.onChange('email', valor)} />
                <label className="grid gap-2 text-sm text-zinc-400 md:col-span-2">
                    Motivo
                    <select
                        value={props.denuncia.motivo}
                        onChange={(e) => props.onChange('motivo', e.target.value)}
                        className="input"
                    >
                        <option>Dados incorretos</option>
                        <option>Localização incorreta</option>
                        <option>Conteúdo inadequado</option>
                        <option>Estabelecimento não existe</option>
                        <option>Outro motivo</option>
                    </select>
                </label>
                <label className="grid gap-2 text-sm text-zinc-400 md:col-span-2">
                    Mensagem
                    <textarea
                        value={props.denuncia.mensagem}
                        onChange={(e) => props.onChange('mensagem', e.target.value)}
                        rows={4}
                        className="input min-h-28"
                    />
                </label>
            </div>
            <button type="button" onClick={props.onEnviar} className="mt-4 rounded bg-zinc-100 px-4 py-3 font-bold text-zinc-950">
                Enviar para revisão
            </button>
            {props.mensagem && <p className="mt-3 text-sm text-zinc-300">{props.mensagem}</p>}
        </section>
    )
}

function CampoDenuncia(props: { label: string; value: string; onChange: (valor: string) => void }) {
    return (
        <label className="grid gap-2 text-sm text-zinc-400">
            {props.label}
            <input value={props.value} onChange={(e) => props.onChange(e.target.value)} className="input" />
        </label>
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
