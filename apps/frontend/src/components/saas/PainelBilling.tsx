'use client'

import useAPI from '@/data/hooks/useAPI'
import { useCallback, useEffect, useState } from 'react'

export default function PainelBilling() {
    const { httpGet, httpPut } = useAPI()
    const [billing, setBilling] = useState<any>(null)
    const [planos, setPlanos] = useState<any[]>([])
    const [mensagem, setMensagem] = useState('')

    const carregar = useCallback(async function carregar() {
        const [dadosBilling, dadosPlanos] = await Promise.all([
            httpGet('/saas/billing'),
            httpGet('/saas/planos'),
        ])
        setBilling(dadosBilling?.statusCode ? null : dadosBilling)
        setPlanos(Array.isArray(dadosPlanos) ? dadosPlanos : [])
    }, [httpGet])

    useEffect(() => {
        carregar()
    }, [carregar])

    async function trocarPlano(planoSlug: string) {
        setMensagem('')
        const resposta = await httpPut('/saas/billing/plano', { planoSlug })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Plano atualizado.')
    }

    return (
        <div className="grid gap-6">
            <section className="grid gap-3 md:grid-cols-3">
                <Resumo titulo="Status" valor={billing?.status ?? '-'} />
                <Resumo titulo="Plano atual" valor={billing?.assinatura?.plano?.nome ?? '-'} />
                <Resumo titulo="Trial até" valor={formatarData(billing?.trialEndsAt)} />
            </section>

            <section className="grid gap-3 md:grid-cols-3">
                <UsoPlano titulo="Profissionais" dados={billing?.limites} chave="profissionais" />
                <UsoPlano titulo="Unidades" dados={billing?.limites} chave="unidades" />
                <UsoPlano titulo="Serviços" dados={billing?.limites} chave="servicos" />
            </section>

            <section className="grid gap-3 lg:grid-cols-3">
                {planos.map((plano) => (
                    <div key={plano.slug} className="rounded border border-zinc-800 bg-zinc-950 p-5">
                        <h2 className="text-xl font-bold text-zinc-100">{plano.nome}</h2>
                        <p className="mt-2 text-sm text-zinc-400">{plano.descricao}</p>
                        <p className="mt-4 text-2xl font-black text-yellow-400">{moeda(plano.precoMensal)}</p>
                        <ul className="mt-4 grid gap-2 text-sm text-zinc-400">
                            <li>{plano.limiteUsuarios} profissionais</li>
                            <li>{plano.limiteUnidades} unidade(s)</li>
                            <li>{plano.limiteServicos} serviço(s)</li>
                        </ul>
                        <button
                            type="button"
                            onClick={() => trocarPlano(plano.slug)}
                            className="mt-4 rounded bg-yellow-400 px-4 py-3 font-bold text-black"
                        >
                            Selecionar
                        </button>
                    </div>
                ))}
            </section>

            {mensagem && <p className="text-sm text-zinc-300">{mensagem}</p>}
        </div>
    )
}

function UsoPlano(props: { titulo: string; dados: any; chave: 'profissionais' | 'unidades' | 'servicos' }) {
    const uso = props.dados?.uso?.[props.chave] ?? 0
    const limite = props.dados?.limites?.[props.chave] ?? 0
    const percentual = props.dados?.percentual?.[props.chave] ?? 0
    const excedido = props.dados?.excedido?.[props.chave]

    return (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-zinc-400">{props.titulo}</span>
                {excedido && <span className="rounded bg-red-500/15 px-2 py-1 text-xs font-bold text-red-300">Limite</span>}
            </div>
            <strong className="mt-2 block text-2xl text-zinc-100">
                {uso}/{limite}
            </strong>
            <div className="mt-4 h-2 overflow-hidden rounded bg-zinc-800">
                <div
                    className={['h-full', excedido ? 'bg-red-400' : 'bg-yellow-400'].join(' ')}
                    style={{ width: `${percentual}%` }}
                />
            </div>
        </div>
    )
}

function Resumo(props: { titulo: string; valor: any }) {
    return (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-5">
            <span className="text-sm text-zinc-400">{props.titulo}</span>
            <strong className="mt-2 block text-2xl text-zinc-100">{props.valor}</strong>
        </div>
    )
}

function moeda(valor: any) {
    return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(valor: string) {
    if (!valor) return '-'
    return new Date(valor).toLocaleDateString('pt-BR')
}
