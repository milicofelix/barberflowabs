'use client'

import useAPI from '@/data/hooks/useAPI'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const cadastroInicial = {
    nomeBarbearia: '',
    slug: '',
    emailBarbearia: '',
    telefoneBarbearia: '',
    nomeDono: '',
    emailDono: '',
    telefoneDono: '',
    senha: '',
    planoSlug: 'starter',
}

export default function OnboardingSaas() {
    const { httpGet, httpPost } = useAPI()
    const [planos, setPlanos] = useState<any[]>([])
    const [form, setForm] = useState(cadastroInicial)
    const [mensagem, setMensagem] = useState('')
    const [criado, setCriado] = useState<any>(null)

    useEffect(() => {
        httpGet('/saas/planos').then((dados) => setPlanos(Array.isArray(dados) ? dados : []))
    }, [httpGet])

    function alterar(campo: string, valor: string) {
        setForm((atual) => ({
            ...atual,
            [campo]: valor,
            ...(campo === 'nomeBarbearia' ? { slug: slugify(valor) } : {}),
        }))
    }

    async function submeter() {
        setMensagem('')
        const resposta = await httpPost('/saas/onboarding', {
            planoSlug: form.planoSlug,
            barbearia: {
                nome: form.nomeBarbearia,
                slug: form.slug,
                email: form.emailBarbearia,
                telefone: form.telefoneBarbearia,
            },
            dono: {
                nome: form.nomeDono,
                email: form.emailDono,
                telefone: form.telefoneDono,
                senha: form.senha,
            },
        })

        if (resposta?.statusCode) return setMensagem(resposta.message)
        setCriado(resposta)
        setMensagem('Barbearia criada com trial ativo.')
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <main className="container flex flex-col gap-8 py-12">
                <header className="max-w-3xl">
                    <span className="text-sm font-semibold text-yellow-400">Barber Flow ABS</span>
                    <h1 className="mt-3 text-4xl font-black">Crie sua barbearia em modo SaaS</h1>
                    <p className="mt-3 text-zinc-400">
                        Trial de 14 dias com agenda, clientes, caixa e gestão operacional.
                    </p>
                </header>

                <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
                    <div className="grid gap-4 rounded border border-zinc-800 bg-zinc-900 p-5">
                        <h2 className="text-xl font-bold">Dados da barbearia</h2>
                        <Campo label="Nome da barbearia" value={form.nomeBarbearia} onChange={(v) => alterar('nomeBarbearia', v)} />
                        <Campo label="Slug" value={form.slug} onChange={(v) => alterar('slug', v)} />
                        <Campo label="E-mail da barbearia" value={form.emailBarbearia} onChange={(v) => alterar('emailBarbearia', v)} />
                        <Campo label="Telefone da barbearia" value={form.telefoneBarbearia} onChange={(v) => alterar('telefoneBarbearia', v)} />

                        <h2 className="mt-4 text-xl font-bold">Responsável</h2>
                        <Campo label="Nome" value={form.nomeDono} onChange={(v) => alterar('nomeDono', v)} />
                        <Campo label="E-mail" value={form.emailDono} onChange={(v) => alterar('emailDono', v)} />
                        <Campo label="Telefone" value={form.telefoneDono} onChange={(v) => alterar('telefoneDono', v)} />
                        <Campo label="Senha" type="password" value={form.senha} onChange={(v) => alterar('senha', v)} />

                        <button type="button" onClick={submeter} className="rounded bg-yellow-400 px-4 py-3 font-bold text-black">
                            Iniciar trial
                        </button>
                        {mensagem && <p className="text-sm text-zinc-300">{mensagem}</p>}
                        {criado && (
                            <Link href="/entrar" className="text-sm font-semibold text-yellow-400">
                                Acessar login
                            </Link>
                        )}
                    </div>

                    <div className="grid content-start gap-3">
                        {planos.map((plano) => (
                            <button
                                key={plano.slug}
                                type="button"
                                onClick={() => alterar('planoSlug', plano.slug)}
                                className={[
                                    'rounded border p-5 text-left',
                                    form.planoSlug === plano.slug
                                        ? 'border-yellow-400 bg-yellow-400 text-black'
                                        : 'border-zinc-800 bg-zinc-900 text-zinc-100',
                                ].join(' ')}
                            >
                                <strong className="text-lg">{plano.nome}</strong>
                                <p className="mt-1 text-sm opacity-80">{plano.descricao}</p>
                                <p className="mt-3 text-2xl font-black">{moeda(plano.precoMensal)}</p>
                            </button>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}

function Campo(props: { label: string; value: string; type?: string; onChange: (valor: string) => void }) {
    return (
        <label className="flex flex-col gap-2 text-sm text-zinc-400">
            {props.label}
            <input
                type={props.type ?? 'text'}
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
                className="input"
            />
        </label>
    )
}

function moeda(valor: any) {
    return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function slugify(valor: string) {
    return valor
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
