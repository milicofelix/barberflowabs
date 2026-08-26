'use client'

import useAPI from '@/data/hooks/useAPI'
import useSessao from '@/data/hooks/useSessao'
import { useCallback, useEffect, useState } from 'react'

const status = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED']

export default function PainelSuperAdmin() {
    const { usuario } = useSessao()
    const { httpGet, httpPut } = useAPI()
    const [barbearias, setBarbearias] = useState<any[]>([])
    const [pendentes, setPendentes] = useState<any[]>([])
    const [auditoria, setAuditoria] = useState<any[]>([])
    const [mensagem, setMensagem] = useState('')
    const [motivoRevisao, setMotivoRevisao] = useState('')
    const [carregando, setCarregando] = useState(true)
    const [acessoNegado, setAcessoNegado] = useState(false)
    const [diagnostico, setDiagnostico] = useState<any>(null)

    const carregar = useCallback(async function carregar() {
        setCarregando(true)
        setAcessoNegado(false)
        const [dadosMe, dadosBarbearias, dadosPendentes, dadosAuditoria] = await Promise.all([
            httpGet('/saas/admin/me'),
            httpGet('/saas/admin/barbearias'),
            httpGet('/saas/admin/barbearias/pendentes'),
            httpGet('/saas/admin/auditoria'),
        ])
        const negado = dadosBarbearias?.statusCode === 403 || dadosAuditoria?.statusCode === 403
        setDiagnostico(dadosMe?.statusCode ? null : dadosMe)
        setAcessoNegado(negado)
        setBarbearias(Array.isArray(dadosBarbearias) ? dadosBarbearias : [])
        setPendentes(Array.isArray(dadosPendentes) ? dadosPendentes : [])
        setAuditoria(Array.isArray(dadosAuditoria) ? dadosAuditoria : [])
        setCarregando(false)
    }, [httpGet])

    useEffect(() => {
        if (usuario) {
            carregar()
            return
        }

        setCarregando(false)
        setAcessoNegado(true)
    }, [carregar, usuario])

    async function alterarStatus(id: number, novoStatus: string) {
        setMensagem('')
        const resposta = await httpPut(`/saas/admin/barbearias/${id}/status`, { status: novoStatus })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Status atualizado.')
    }

    async function aprovarBarbearia(id: number) {
        setMensagem('')
        const resposta = await httpPut(`/saas/admin/barbearias/${id}/aprovar`, {
            motivo: motivoRevisao || undefined,
        })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        setMotivoRevisao('')
        await carregar()
        setMensagem('Barbearia aprovada.')
    }

    async function reprovarBarbearia(id: number) {
        setMensagem('')
        const resposta = await httpPut(`/saas/admin/barbearias/${id}/reprovar`, {
            motivo: motivoRevisao,
        })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        setMotivoRevisao('')
        await carregar()
        setMensagem('Barbearia reprovada.')
    }

    if (carregando) {
        return <p className="rounded border border-zinc-800 bg-zinc-950 p-5 text-zinc-300">Carregando admin SaaS...</p>
    }

    if (acessoNegado || !usuario) {
        return <DiagnosticoAcesso diagnostico={diagnostico} />
    }

    return (
        <div className="grid gap-6">
            <section className="rounded border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100">Fila de aprovação</h2>
                        <p className="text-sm text-zinc-400">{pendentes.length} cadastro(s) aguardando revisão</p>
                    </div>
                    <input
                        value={motivoRevisao}
                        onChange={(e) => setMotivoRevisao(e.target.value)}
                        placeholder="Motivo/observação da revisão"
                        className="input md:w-96"
                    />
                </div>
                <div className="mt-4 grid gap-3">
                    {pendentes.map((barbearia) => (
                        <BarbeariaPendente
                            key={barbearia.id}
                            barbearia={barbearia}
                            onAprovar={aprovarBarbearia}
                            onReprovar={reprovarBarbearia}
                        />
                    ))}
                    {pendentes.length === 0 && <p className="text-sm text-zinc-400">Nenhum cadastro pendente.</p>}
                </div>
            </section>

            <section className="grid gap-3">
                {barbearias.map((barbearia) => (
                    <div key={barbearia.id} className="rounded border border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-100">{barbearia.nome}</h2>
                                <p className="text-sm text-zinc-400">
                                    {barbearia.slug} | {barbearia.assinatura?.plano?.nome ?? 'sem plano'}
                                </p>
                                <p className="text-sm text-zinc-500">
                                    Revisão: {barbearia.reviewStatus ?? 'APPROVED'} | Assinatura: {barbearia.status}
                                </p>
                                <p className="text-sm text-zinc-500">
                                    {barbearia._count?.profissionais ?? 0} profissionais | {barbearia._count?.servicos ?? 0} serviços | {barbearia._count?.agendamentos ?? 0} agendamentos
                                </p>
                                <div className="mt-3 grid gap-2 text-xs text-zinc-400 md:grid-cols-3">
                                    <UsoLimite label="Profissionais" dados={barbearia.limites} chave="profissionais" />
                                    <UsoLimite label="Unidades" dados={barbearia.limites} chave="unidades" />
                                    <UsoLimite label="Serviços" dados={barbearia.limites} chave="servicos" />
                                </div>
                            </div>
                            <select
                                value={barbearia.status}
                                onChange={(e) => alterarStatus(barbearia.id, e.target.value)}
                                className="input lg:w-56"
                            >
                                {status.map((item) => (
                                    <option key={item}>{item}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </section>

            <section className="rounded border border-zinc-800 bg-zinc-950 p-5">
                <h2 className="text-xl font-bold text-zinc-100">Auditoria</h2>
                <div className="mt-4 grid gap-3">
                    {auditoria.map((log) => (
                        <div key={log.id} className="rounded border border-zinc-800 p-3">
                            <p className="font-semibold text-zinc-100">{log.acao}</p>
                            <p className="text-sm text-zinc-400">
                                {log.barbearia?.nome ?? '-'} | {log.usuario?.email ?? '-'} | {formatarData(log.createdAt)}
                            </p>
                        </div>
                    ))}
                    {auditoria.length === 0 && <p className="text-sm text-zinc-400">Sem registros.</p>}
                </div>
            </section>

            {mensagem && <p className="text-sm text-zinc-300">{mensagem}</p>}
        </div>
    )
}

function BarbeariaPendente(props: {
    barbearia: any
    onAprovar: (id: number) => void
    onReprovar: (id: number) => void
}) {
    const barbearia = props.barbearia

    return (
        <div className="rounded border border-yellow-400/30 bg-zinc-900 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-lg font-bold text-zinc-100">{barbearia.nome}</h3>
                    <p className="text-sm text-zinc-400">
                        {barbearia.slug} | {barbearia.email ?? 'sem e-mail'} | {barbearia.telefone ?? 'sem telefone'}
                    </p>
                    <p className="text-sm text-zinc-500">
                        Plano {barbearia.assinatura?.plano?.nome ?? '-'} | criado em {formatarData(barbearia.createdAt)}
                    </p>
                    {barbearia.reviewReason && (
                        <p className="mt-2 text-sm text-zinc-400">{barbearia.reviewReason}</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => props.onAprovar(barbearia.id)}
                        className="rounded bg-emerald-500 px-4 py-2 font-bold text-white"
                    >
                        Aprovar
                    </button>
                    <button
                        type="button"
                        onClick={() => props.onReprovar(barbearia.id)}
                        className="rounded bg-red-500/15 px-4 py-2 font-bold text-red-300"
                    >
                        Reprovar
                    </button>
                </div>
            </div>
        </div>
    )
}

function DiagnosticoAcesso({ diagnostico }: { diagnostico: any }) {
    return (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-5 text-zinc-300">
            <h2 className="text-xl font-bold text-zinc-100">Acesso restrito</h2>
            <div className="mt-4 grid gap-2 text-sm">
                <LinhaDiagnostico label="E-mail" valor={diagnostico?.email ?? '-'} />
                <LinhaDiagnostico label="Role no token" valor={diagnostico?.role ?? '-'} />
                <LinhaDiagnostico label="Papel no banco" valor={diagnostico?.papel ?? '-'} />
                <LinhaDiagnostico label="Super admin por banco" valor={simNao(diagnostico?.superAdminPorBanco)} />
                <LinhaDiagnostico label="Super admin por env" valor={simNao(diagnostico?.superAdminPorEnv)} />
                <LinhaDiagnostico label="Env configurado" valor={simNao(diagnostico?.superAdminEmailsConfigurado)} />
            </div>
        </div>
    )
}

function LinhaDiagnostico(props: { label: string; valor: string }) {
    return (
        <p className="flex flex-wrap justify-between gap-3 border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{props.label}</span>
            <strong className="text-zinc-200">{props.valor}</strong>
        </p>
    )
}

function simNao(valor: boolean) {
    return valor ? 'sim' : 'não'
}

function UsoLimite(props: { label: string; dados: any; chave: 'profissionais' | 'unidades' | 'servicos' }) {
    const uso = props.dados?.uso?.[props.chave] ?? 0
    const limite = props.dados?.limites?.[props.chave] ?? 0
    const excedido = props.dados?.excedido?.[props.chave]

    return (
        <span className={['rounded border px-2 py-1', excedido ? 'border-red-500/40 text-red-300' : 'border-zinc-800'].join(' ')}>
            {props.label}: {uso}/{limite}
        </span>
    )
}

function formatarData(valor: string) {
    if (!valor) return '-'
    return new Date(valor).toLocaleString('pt-BR')
}
