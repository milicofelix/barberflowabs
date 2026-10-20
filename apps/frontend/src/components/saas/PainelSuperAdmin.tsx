'use client'

import useAPI from '@/data/hooks/useAPI'
import useSessao from '@/data/hooks/useSessao'
import CuradoriaServicos from './CuradoriaServicos'
import CuradoriaMidias from './CuradoriaMidias'
import { useCallback, useEffect, useState } from 'react'

const status = ['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED']
const statusComercial = [
    { valor: 'NOVO', label: 'Novo' },
    { valor: 'EM_CONTATO', label: 'Em contato' },
    { valor: 'APROVADO', label: 'Aprovado' },
    { valor: 'RECUSADO', label: 'Recusado' },
    { valor: 'CONVERTIDO', label: 'Convertido' },
]
const statusDenuncia = ['PENDENTE', 'EM_ANALISE', 'RESOLVIDA', 'DESCARTADA']

export default function PainelSuperAdmin() {
    const { usuario } = useSessao()
    const { httpGet, httpPost, httpPut } = useAPI()
    const [estabelecimentos, setEstabelecimentos] = useState<any[]>([])
    const [pendentes, setPendentes] = useState<any[]>([])
    const [auditoria, setAuditoria] = useState<any[]>([])
    const [notificacoes, setNotificacoes] = useState<any[]>([])
    const [denuncias, setDenuncias] = useState<any[]>([])
    const [planos, setPlanos] = useState<any[]>([])
    const [mensagem, setMensagem] = useState('')
    const [motivoRevisao, setMotivoRevisao] = useState('')
    const [carregando, setCarregando] = useState(true)
    const [acessoNegado, setAcessoNegado] = useState(false)
    const [diagnostico, setDiagnostico] = useState<any>(null)
    const [comercial, setComercial] = useState<Record<number, any>>({})
    const [planosEditados, setPlanosEditados] = useState<Record<number, any>>({})
    const [denunciasEditadas, setDenunciasEditadas] = useState<Record<number, any>>({})

    const carregar = useCallback(async function carregar() {
        setCarregando(true)
        setAcessoNegado(false)
        const [dadosMe, dadosEstabelecimentos, dadosPendentes, dadosAuditoria, dadosPlanos, dadosNotificacoes, dadosDenuncias] = await Promise.all([
            httpGet('/saas/admin/me'),
            httpGet('/saas/admin/estabelecimentos'),
            httpGet('/saas/admin/estabelecimentos/pendentes'),
            httpGet('/saas/admin/auditoria'),
            httpGet('/saas/admin/planos'),
            httpGet('/saas/admin/notificacoes'),
            httpGet('/saas/admin/denuncias-perfil'),
        ])
        const negado = dadosEstabelecimentos?.statusCode === 403 || dadosAuditoria?.statusCode === 403
        setDiagnostico(dadosMe?.statusCode ? null : dadosMe)
        setAcessoNegado(negado)
        setEstabelecimentos(Array.isArray(dadosEstabelecimentos) ? dadosEstabelecimentos : [])
        setPendentes(Array.isArray(dadosPendentes) ? dadosPendentes : [])
        setAuditoria(Array.isArray(dadosAuditoria) ? dadosAuditoria : [])
        setPlanos(Array.isArray(dadosPlanos) ? dadosPlanos : [])
        setNotificacoes(Array.isArray(dadosNotificacoes) ? dadosNotificacoes : [])
        setDenuncias(Array.isArray(dadosDenuncias) ? dadosDenuncias : [])
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
        const resposta = await httpPut(`/saas/admin/estabelecimentos/${id}/status`, { status: novoStatus })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Status atualizado.')
    }

    async function processarInadimplencia() {
        setMensagem('')
        const resposta = await httpPost('/saas/admin/inadimplencia/processar', {})
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem(`${resposta?.processadas ?? 0} cobrança(s) vencida(s) processada(s).`)
    }

    async function alternarDestaque(id: number, destaqueAtual: boolean) {
        setMensagem('')
        const resposta = await httpPut(`/saas/admin/estabelecimentos/${id}/destaque`, { destaque: !destaqueAtual })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem(!destaqueAtual ? 'Estabelecimento destacada.' : 'Destaque removido.')
    }

    async function aprovarEstabelecimento(id: number) {
        setMensagem('')
        const resposta = await httpPut(`/saas/admin/estabelecimentos/${id}/aprovar`, {
            motivo: motivoRevisao || undefined,
        })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        setMotivoRevisao('')
        await carregar()
        setMensagem('Estabelecimento aprovada.')
    }

    async function reprovarEstabelecimento(id: number) {
        setMensagem('')
        const resposta = await httpPut(`/saas/admin/estabelecimentos/${id}/reprovar`, {
            motivo: motivoRevisao,
        })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        setMotivoRevisao('')
        await carregar()
        setMensagem('Estabelecimento reprovada.')
    }

    async function salvarComercial(estabelecimento: any) {
        setMensagem('')
        const dados = comercial[estabelecimento.id] ?? {}
        const resposta = await httpPut(`/saas/admin/estabelecimentos/${estabelecimento.id}/comercial`, {
            comercialStatus: dados.comercialStatus ?? estabelecimento.comercialStatus ?? 'NOVO',
            notasInternas: dados.notasInternas ?? estabelecimento.notasInternas ?? '',
            ultimoContatoEm: dados.ultimoContatoEm ?? dataInput(estabelecimento.ultimoContatoEm),
            proximoContatoEm: dados.proximoContatoEm ?? dataInput(estabelecimento.proximoContatoEm),
        })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Dados comerciais atualizados.')
    }

    function atualizarComercial(id: number, campo: string, valor: string) {
        setComercial((atual) => ({
            ...atual,
            [id]: {
                ...(atual[id] ?? {}),
                [campo]: valor,
            },
        }))
    }

    async function salvarPlano(plano: any) {
        setMensagem('')
        const dados = planosEditados[plano.id] ?? {}
        const resposta = await httpPut(`/saas/admin/planos/${plano.id}`, {
            nome: dados.nome ?? plano.nome,
            descricao: dados.descricao ?? plano.descricao,
            precoMensal: Number(dados.precoMensal ?? plano.precoMensal ?? 0),
            limiteUsuarios: Number(dados.limiteUsuarios ?? plano.limiteUsuarios ?? 0),
            limiteUnidades: Number(dados.limiteUnidades ?? plano.limiteUnidades ?? 0),
            limiteServicos: Number(dados.limiteServicos ?? plano.limiteServicos ?? 0),
            ativo: dados.ativo ?? plano.ativo,
        })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Plano atualizado.')
    }

    function atualizarPlano(id: number, campo: string, valor: string | boolean) {
        setPlanosEditados((atual) => ({
            ...atual,
            [id]: {
                ...(atual[id] ?? {}),
                [campo]: valor,
            },
        }))
    }

    function atualizarDenuncia(id: number, campo: string, valor: string) {
        setDenunciasEditadas((atual) => ({
            ...atual,
            [id]: {
                ...(atual[id] ?? {}),
                [campo]: valor,
            },
        }))
    }

    async function revisarDenuncia(denuncia: any) {
        setMensagem('')
        const dados = denunciasEditadas[denuncia.id] ?? {}
        const resposta = await httpPut(`/saas/admin/denuncias-perfil/${denuncia.id}`, {
            status: dados.status ?? denuncia.status,
            resolucao: dados.resolucao ?? denuncia.resolucao ?? '',
        })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Denúncia atualizada.')
    }

    if (carregando) {
        return <p className="rounded border border-zinc-800 bg-zinc-950 p-5 text-zinc-300">Carregando admin SaaS...</p>
    }

    if (acessoNegado || !usuario) {
        return <DiagnosticoAcesso diagnostico={diagnostico} />
    }

    return (
        <div className="grid gap-6">
            <CuradoriaServicos />
            <CuradoriaMidias />
            <section className="rounded border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100">Planos e cobrança</h2>
                        <p className="text-sm text-zinc-400">Valores, limites e inadimplência da plataforma</p>
                    </div>
                    <button type="button" className="button-outline" onClick={processarInadimplencia}>Processar inadimplência</button>
                </div>
                <div className="mt-4 grid gap-3">
                    {planos.map((plano) => (
                        <PlanoAdmin
                            key={plano.id}
                            plano={plano}
                            editado={planosEditados[plano.id] ?? {}}
                            onChange={atualizarPlano}
                            onSalvar={salvarPlano}
                        />
                    ))}
                    {planos.length === 0 && <p className="text-sm text-zinc-400">Nenhum plano cadastrado.</p>}
                </div>
            </section>

            <section className="rounded border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100">Notificações</h2>
                        <p className="text-sm text-zinc-400">Eventos que precisam da atenção do dono da plataforma</p>
                    </div>
                    <span className="text-sm font-semibold text-yellow-400">{notificacoes.length} recente(s)</span>
                </div>
                <div className="mt-4 grid gap-3">
                    {notificacoes.map((notificacao) => (
                        <NotificacaoAdmin key={notificacao.id} notificacao={notificacao} />
                    ))}
                    {notificacoes.length === 0 && <p className="text-sm text-zinc-400">Sem notificações recentes.</p>}
                </div>
            </section>

            <section className="rounded border border-zinc-800 bg-zinc-950 p-5">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-100">Denúncias de perfis</h2>
                        <p className="text-sm text-zinc-400">Revisão de dados públicos, localização e conteúdo reportado por clientes</p>
                    </div>
                    <span className="text-sm font-semibold text-yellow-400">
                        {denuncias.filter((item) => item.status !== 'RESOLVIDA' && item.status !== 'DESCARTADA').length} aberta(s)
                    </span>
                </div>
                <div className="mt-4 grid gap-3">
                    {denuncias.map((denuncia) => (
                        <DenunciaAdmin
                            key={denuncia.id}
                            denuncia={denuncia}
                            editada={denunciasEditadas[denuncia.id] ?? {}}
                            onChange={atualizarDenuncia}
                            onSalvar={revisarDenuncia}
                        />
                    ))}
                    {denuncias.length === 0 && <p className="text-sm text-zinc-400">Nenhuma denúncia recebida.</p>}
                </div>
            </section>

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
                    {pendentes.map((estabelecimento) => (
                        <EstabelecimentoPendente
                            key={estabelecimento.id}
                            estabelecimento={estabelecimento}
                            onAprovar={aprovarEstabelecimento}
                            onReprovar={reprovarEstabelecimento}
                        />
                    ))}
                    {pendentes.length === 0 && <p className="text-sm text-zinc-400">Nenhum cadastro pendente.</p>}
                </div>
            </section>

            <section className="grid gap-3">
                {estabelecimentos.map((estabelecimento) => (
                    <div key={estabelecimento.id} className="rounded border border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-100">{estabelecimento.nome}</h2>
                                <p className="text-sm text-zinc-400">
                                    {estabelecimento.slug} | {estabelecimento.assinatura?.plano?.nome ?? 'sem plano'}
                                </p>
                                <p className="text-sm text-zinc-500">
                                    Revisão: {estabelecimento.reviewStatus ?? 'APPROVED'} | Assinatura: {estabelecimento.status}
                                </p>
                                <p className="text-sm text-zinc-500">
                                    {estabelecimento._count?.profissionais ?? 0} profissionais | {estabelecimento._count?.servicos ?? 0} serviços | {estabelecimento._count?.agendamentos ?? 0} agendamentos
                                </p>
                                <div className="mt-3 grid gap-2 text-xs text-zinc-400 md:grid-cols-3">
                                    <UsoLimite label="Profissionais" dados={estabelecimento.limites} chave="profissionais" />
                                    <UsoLimite label="Unidades" dados={estabelecimento.limites} chave="unidades" />
                                    <UsoLimite label="Serviços" dados={estabelecimento.limites} chave="servicos" />
                                </div>
                            </div>
                            <div className="grid gap-2 lg:w-56">
                                <select
                                    value={estabelecimento.status}
                                    onChange={(e) => alterarStatus(estabelecimento.id, e.target.value)}
                                    className="input"
                                >
                                    {status.map((item) => (
                                        <option key={item}>{item}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => alternarDestaque(estabelecimento.id, !!estabelecimento.destaque)}
                                    className={[
                                        'rounded px-4 py-2 text-sm font-bold',
                                        estabelecimento.destaque ? 'bg-yellow-400 text-black' : 'border border-zinc-700 text-zinc-200',
                                    ].join(' ')}
                                >
                                    {estabelecimento.destaque ? 'Remover destaque' : 'Destacar'}
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3 border-t border-zinc-800 pt-4 lg:grid-cols-[180px_160px_160px_1fr_auto] lg:items-end">
                            <label className="grid gap-1 text-sm text-zinc-400">
                                Status comercial
                                <select
                                    value={valorComercial(comercial, estabelecimento, 'comercialStatus', 'NOVO')}
                                    onChange={(e) => atualizarComercial(estabelecimento.id, 'comercialStatus', e.target.value)}
                                    className="input"
                                >
                                    {statusComercial.map((item) => (
                                        <option key={item.valor} value={item.valor}>{item.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1 text-sm text-zinc-400">
                                Último contato
                                <input
                                    type="date"
                                    value={valorComercial(comercial, estabelecimento, 'ultimoContatoEm', dataInput(estabelecimento.ultimoContatoEm))}
                                    onChange={(e) => atualizarComercial(estabelecimento.id, 'ultimoContatoEm', e.target.value)}
                                    className="input"
                                />
                            </label>
                            <label className="grid gap-1 text-sm text-zinc-400">
                                Próximo contato
                                <input
                                    type="date"
                                    value={valorComercial(comercial, estabelecimento, 'proximoContatoEm', dataInput(estabelecimento.proximoContatoEm))}
                                    onChange={(e) => atualizarComercial(estabelecimento.id, 'proximoContatoEm', e.target.value)}
                                    className="input"
                                />
                            </label>
                            <label className="grid gap-1 text-sm text-zinc-400">
                                Notas internas
                                <input
                                    value={valorComercial(comercial, estabelecimento, 'notasInternas', estabelecimento.notasInternas ?? '')}
                                    onChange={(e) => atualizarComercial(estabelecimento.id, 'notasInternas', e.target.value)}
                                    placeholder="Resumo do contato comercial"
                                    className="input"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => salvarComercial(estabelecimento)}
                                className="rounded bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-950"
                            >
                                Salvar comercial
                            </button>
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
                                {log.estabelecimento?.nome ?? '-'} | {log.usuario?.email ?? '-'} | {formatarData(log.createdAt)}
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

function PlanoAdmin(props: {
    plano: any
    editado: any
    onChange: (id: number, campo: string, valor: string | boolean) => void
    onSalvar: (plano: any) => void
}) {
    const plano = props.plano

    return (
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_130px_110px_110px_110px_90px_auto] lg:items-end">
                <label className="grid gap-1 text-sm text-zinc-400">
                    Plano
                    <input
                        value={props.editado.nome ?? plano.nome ?? ''}
                        onChange={(e) => props.onChange(plano.id, 'nome', e.target.value)}
                        className="input"
                    />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                    Valor do ciclo
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={props.editado.precoMensal ?? plano.precoMensal ?? 0}
                        onChange={(e) => props.onChange(plano.id, 'precoMensal', e.target.value)}
                        className="input"
                    />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                    Usuários
                    <input
                        type="number"
                        min="0"
                        value={props.editado.limiteUsuarios ?? plano.limiteUsuarios ?? 0}
                        onChange={(e) => props.onChange(plano.id, 'limiteUsuarios', e.target.value)}
                        className="input"
                    />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                    Unidades
                    <input
                        type="number"
                        min="0"
                        value={props.editado.limiteUnidades ?? plano.limiteUnidades ?? 0}
                        onChange={(e) => props.onChange(plano.id, 'limiteUnidades', e.target.value)}
                        className="input"
                    />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                    Serviços
                    <input
                        type="number"
                        min="0"
                        value={props.editado.limiteServicos ?? plano.limiteServicos ?? 0}
                        onChange={(e) => props.onChange(plano.id, 'limiteServicos', e.target.value)}
                        className="input"
                    />
                </label>
                <label className="grid gap-1 text-sm text-zinc-400">
                    Ativo
                    <input
                        type="checkbox"
                        checked={props.editado.ativo ?? plano.ativo ?? true}
                        onChange={(e) => props.onChange(plano.id, 'ativo', e.target.checked)}
                        className="h-10 w-5"
                    />
                </label>
                <button
                    type="button"
                    onClick={() => props.onSalvar(plano)}
                    className="rounded bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-950"
                >
                    Salvar plano
                </button>
            </div>
            <label className="mt-3 grid gap-1 text-sm text-zinc-400">
                Descrição
                <input
                    value={props.editado.descricao ?? plano.descricao ?? ''}
                    onChange={(e) => props.onChange(plano.id, 'descricao', e.target.value)}
                    className="input"
                />
            </label>
            <p className="mt-2 text-xs font-semibold text-zinc-500">
                {plano.ciclo?.cobranca ?? 'Pagamento via PIX'}{Number(plano.economiaPercentual ?? 0) > 0 ? ` | ${plano.economiaPercentual}% de desconto` : ''}
            </p>
        </div>
    )
}

function NotificacaoAdmin({ notificacao }: { notificacao: any }) {
    const detalhes = notificacao.detalhes ?? {}

    return (
        <div className="rounded border border-yellow-400/20 bg-zinc-900 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="font-bold text-zinc-100">{detalhes.titulo ?? notificacao.acao}</p>
                    <p className="mt-1 text-sm text-zinc-400">{detalhes.mensagem ?? 'Evento registrado para acompanhamento.'}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                        {notificacao.usuario?.email ?? '-'} | {formatarData(notificacao.createdAt)}
                    </p>
                </div>
                {detalhes.estabelecimentoSlug && (
                    <span className="rounded border border-zinc-700 px-2 py-1 text-xs font-semibold text-zinc-300">
                        {detalhes.estabelecimentoSlug}
                    </span>
                )}
            </div>
        </div>
    )
}

function DenunciaAdmin(props: {
    denuncia: any
    editada: any
    onChange: (id: number, campo: string, valor: string) => void
    onSalvar: (denuncia: any) => void
}) {
    const denuncia = props.denuncia

    return (
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-zinc-100">{denuncia.estabelecimento?.nome ?? 'Estabelecimento'}</h3>
                        <span className={classeStatusDenuncia(denuncia.status)}>{denuncia.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">
                        {denuncia.estabelecimento?.slug ?? '-'} | {denuncia.motivo} | {formatarData(denuncia.createdAt)}
                    </p>
                    <p className="mt-3 text-sm text-zinc-300">{denuncia.mensagem}</p>
                    {(denuncia.nome || denuncia.email) && (
                        <p className="mt-2 text-xs text-zinc-500">
                            Reportado por {denuncia.nome ?? 'anônimo'} {denuncia.email ? `| ${denuncia.email}` : ''}
                        </p>
                    )}
                </div>
                <div className="grid gap-2 lg:w-80">
                    <select
                        value={props.editada.status ?? denuncia.status}
                        onChange={(e) => props.onChange(denuncia.id, 'status', e.target.value)}
                        className="input"
                    >
                        {statusDenuncia.map((item) => (
                            <option key={item}>{item}</option>
                        ))}
                    </select>
                    <textarea
                        value={props.editada.resolucao ?? denuncia.resolucao ?? ''}
                        onChange={(e) => props.onChange(denuncia.id, 'resolucao', e.target.value)}
                        placeholder="Resolução interna"
                        rows={3}
                        className="input min-h-24"
                    />
                    <button
                        type="button"
                        onClick={() => props.onSalvar(denuncia)}
                        className="rounded bg-zinc-100 px-4 py-2 text-sm font-bold text-zinc-950"
                    >
                        Salvar revisão
                    </button>
                </div>
            </div>
        </div>
    )
}

function EstabelecimentoPendente(props: {
    estabelecimento: any
    onAprovar: (id: number) => void
    onReprovar: (id: number) => void
}) {
    const estabelecimento = props.estabelecimento

    return (
        <div className="rounded border border-yellow-400/30 bg-zinc-900 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h3 className="text-lg font-bold text-zinc-100">{estabelecimento.nome}</h3>
                    <p className="text-sm text-zinc-400">
                        {estabelecimento.slug} | {estabelecimento.email ?? 'sem e-mail'} | {estabelecimento.telefone ?? 'sem telefone'}
                    </p>
                    <p className="text-sm text-zinc-500">
                        Plano {estabelecimento.assinatura?.plano?.nome ?? '-'} | criado em {formatarData(estabelecimento.createdAt)}
                    </p>
                    {estabelecimento.reviewReason && (
                        <p className="mt-2 text-sm text-zinc-400">{estabelecimento.reviewReason}</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => props.onAprovar(estabelecimento.id)}
                        className="rounded bg-emerald-500 px-4 py-2 font-bold text-white"
                    >
                        Aprovar
                    </button>
                    <button
                        type="button"
                        onClick={() => props.onReprovar(estabelecimento.id)}
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

function dataInput(valor?: string | null) {
    if (!valor) return ''
    return new Date(valor).toISOString().slice(0, 10)
}

function valorComercial(comercial: Record<number, any>, estabelecimento: any, campo: string, fallback: string) {
    return comercial[estabelecimento.id]?.[campo] ?? fallback
}

function classeStatusDenuncia(status: string) {
    const base = 'rounded px-2 py-1 text-xs font-bold'
    if (status === 'PENDENTE') return `${base} bg-yellow-400 text-black`
    if (status === 'EM_ANALISE') return `${base} bg-sky-500/20 text-sky-200`
    if (status === 'RESOLVIDA') return `${base} bg-emerald-500/20 text-emerald-200`
    return `${base} bg-zinc-700 text-zinc-200`
}
