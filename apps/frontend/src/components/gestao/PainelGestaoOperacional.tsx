'use client'

import useAPI from '@/data/hooks/useAPI'
import { Profissional, Servico } from '@barbabrutal/core'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'

type Aba =
    | 'dashboard'
    | 'agenda'
    | 'clientes'
    | 'financeiro'
    | 'relatorios'
    | 'relacionamento'
    | 'servicos'
    | 'profissionais'

const hoje = () => new Date().toISOString().slice(0, 10)

const servicoVazio: Omit<Servico, 'id'> = {
    nome: '',
    descricao: '',
    preco: 50,
    qtdeSlots: 2,
    imagemURL: '/servicos/corte-de-cabelo.jpg',
}

const profissionalVazio: Omit<Profissional, 'id'> = {
    nome: '',
    descricao: '',
    imagemURL: '/profissionais/profissional-1.jpg',
    avaliacao: 5,
    quantidadeAvaliacoes: 0,
}

const lancamentoVazio = {
    tipo: 'RECEITA',
    descricao: '',
    categoria: '',
    valor: 0,
    data: hoje(),
}

const clienteVazio = {
    nome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    senha: '',
}

const lembreteVazio = {
    tipo: 'RETORNO',
    canal: 'WHATSAPP',
    usuarioId: '',
    mensagem: '',
    dataPrevista: `${hoje()}T09:00`,
}

const statusAgenda = ['AGENDADO', 'CONFIRMADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW']

export default function PainelGestaoOperacional() {
    const { httpGet, httpPost, httpPut, httpDelete } = useAPI()
    const [aba, setAba] = useState<Aba>('dashboard')
    const [dataOperacao, setDataOperacao] = useState(hoje())
    const [inicioRelatorio, setInicioRelatorio] = useState(hoje())
    const [fimRelatorio, setFimRelatorio] = useState(hoje())
    const [dashboard, setDashboard] = useState<any>(null)
    const [agendamentos, setAgendamentos] = useState<any[]>([])
    const [clientes, setClientes] = useState<any[]>([])
    const [historico, setHistorico] = useState<any>(null)
    const [lancamentos, setLancamentos] = useState<any[]>([])
    const [relatorio, setRelatorio] = useState<any>(null)
    const [relacionamento, setRelacionamento] = useState<any>(null)
    const [servicos, setServicos] = useState<Servico[]>([])
    const [profissionais, setProfissionais] = useState<Profissional[]>([])
    const [cliente, setCliente] = useState<any>(clienteVazio)
    const [servico, setServico] = useState<any>(servicoVazio)
    const [profissional, setProfissional] = useState<any>(profissionalVazio)
    const [lancamento, setLancamento] = useState<any>(lancamentoVazio)
    const [lembrete, setLembrete] = useState<any>(lembreteVazio)
    const [mensagem, setMensagem] = useState('')

    const carregar = useCallback(async () => {
        const [
            dadosDashboard,
            dadosAgenda,
            dadosClientes,
            dadosFinanceiro,
            dadosRelatorio,
            dadosServicos,
            dadosProfissionais,
            dadosRelacionamento,
        ] = await Promise.all([
            httpGet('/gestao/dashboard'),
            httpGet(`/gestao/agendamentos?data=${dataOperacao}`),
            httpGet('/gestao/clientes'),
            httpGet(`/gestao/financeiro?inicio=${inicioRelatorio}&fim=${fimRelatorio}`),
            httpGet(`/gestao/relatorios?inicio=${inicioRelatorio}&fim=${fimRelatorio}`),
            httpGet('/servicos'),
            httpGet('/profissionais'),
            httpGet('/gestao/relacionamento'),
        ])

        setDashboard(dadosDashboard?.statusCode ? null : dadosDashboard)
        setAgendamentos(Array.isArray(dadosAgenda) ? dadosAgenda : [])
        setClientes(Array.isArray(dadosClientes) ? dadosClientes : [])
        setLancamentos(Array.isArray(dadosFinanceiro) ? dadosFinanceiro : [])
        setRelatorio(dadosRelatorio?.statusCode ? null : dadosRelatorio)
        setServicos(Array.isArray(dadosServicos) ? dadosServicos : [])
        setProfissionais(Array.isArray(dadosProfissionais) ? dadosProfissionais : [])
        setRelacionamento(dadosRelacionamento?.statusCode ? null : dadosRelacionamento)
    }, [dataOperacao, fimRelatorio, httpGet, inicioRelatorio])

    useEffect(() => {
        carregar()
    }, [carregar])

    async function salvarServico() {
        setMensagem('')
        const payload = {
            nome: servico.nome,
            descricao: servico.descricao,
            preco: Number(servico.preco),
            qtdeSlots: Number(servico.qtdeSlots),
            imagemURL: servico.imagemURL,
        }
        const resposta = servico.id
            ? await httpPut(`/servicos/${servico.id}`, payload)
            : await httpPost('/servicos', payload)

        if (resposta?.statusCode) return setMensagem(resposta.message)

        setServico(servicoVazio)
        await carregar()
        setMensagem('Serviço salvo.')
    }

    async function excluirServico(id: number) {
        setMensagem('')
        const resposta = await httpDelete(`/servicos/${id}`)
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Serviço excluído.')
    }

    async function salvarProfissional() {
        setMensagem('')
        const payload = {
            nome: profissional.nome,
            descricao: profissional.descricao,
            imagemURL: profissional.imagemURL,
            avaliacao: Number(profissional.avaliacao ?? 5),
            quantidadeAvaliacoes: Number(profissional.quantidadeAvaliacoes ?? 0),
        }
        const resposta = profissional.id
            ? await httpPut(`/profissionais/${profissional.id}`, payload)
            : await httpPost('/profissionais', payload)

        if (resposta?.statusCode) return setMensagem(resposta.message)

        setProfissional(profissionalVazio)
        await carregar()
        setMensagem('Profissional salvo.')
    }

    async function excluirProfissional(id: number) {
        setMensagem('')
        const resposta = await httpDelete(`/profissionais/${id}`)
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Profissional excluído.')
    }

    async function alterarStatus(id: number, status: string) {
        setMensagem('')
        const resposta = await httpPut(`/gestao/agendamentos/${id}/status`, { status })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Status atualizado.')
    }

    async function carregarHistorico(clienteId: number) {
        setMensagem('')
        const resposta = await httpGet(`/gestao/clientes/${clienteId}/historico`)
        if (resposta?.statusCode) return setMensagem(resposta.message)
        setHistorico(resposta)
    }

    async function salvarCliente() {
        setMensagem('')
        const payload = {
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone,
            dataNascimento: cliente.dataNascimento || undefined,
            ...(cliente.senha ? { senha: cliente.senha } : {}),
        }
        const resposta = cliente.id
            ? await httpPut(`/gestao/clientes/${cliente.id}`, payload)
            : await httpPost('/gestao/clientes', payload)

        if (resposta?.statusCode) return setMensagem(resposta.message)

        setCliente(clienteVazio)
        await carregar()
        setMensagem('Cliente salvo.')
    }

    async function excluirCliente(id: number) {
        setMensagem('')
        const resposta = await httpDelete(`/gestao/clientes/${id}`)
        if (resposta?.statusCode) return setMensagem(resposta.message)
        if (historico?.id === id) setHistorico(null)
        await carregar()
        setMensagem('Cliente excluído.')
    }

    async function salvarLancamento() {
        setMensagem('')
        const payload = { ...lancamento, valor: Number(lancamento.valor) }
        const resposta = await httpPost('/gestao/financeiro', payload)
        if (resposta?.statusCode) return setMensagem(resposta.message)
        setLancamento(lancamentoVazio)
        await carregar()
        setMensagem('Lançamento salvo.')
    }

    async function excluirLancamento(id: number) {
        setMensagem('')
        const resposta = await httpDelete(`/gestao/financeiro/${id}`)
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Lançamento excluído.')
    }

    async function salvarLembrete() {
        setMensagem('')
        const payload = {
            ...lembrete,
            usuarioId: lembrete.usuarioId ? Number(lembrete.usuarioId) : undefined,
            dataPrevista: new Date(lembrete.dataPrevista).toISOString(),
        }
        const resposta = await httpPost('/gestao/relacionamento/lembretes', payload)
        if (resposta?.statusCode) return setMensagem(resposta.message)
        setLembrete(lembreteVazio)
        await carregar()
        setMensagem('Lembrete criado.')
    }

    async function alterarStatusLembrete(id: number, status: string) {
        setMensagem('')
        const resposta = await httpPut(`/gestao/relacionamento/lembretes/${id}/status`, { status })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Lembrete atualizado.')
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
                {([
                    ['dashboard', 'Dashboard'],
                    ['agenda', 'Agenda'],
                    ['clientes', 'Clientes'],
                    ['financeiro', 'Caixa'],
                    ['relatorios', 'Relatórios'],
                    ['relacionamento', 'Relacionamento'],
                    ['servicos', 'Serviços'],
                    ['profissionais', 'Profissionais'],
                ] as [Aba, string][]).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setAba(id)} className={botaoAba(aba === id)}>
                        {label}
                    </button>
                ))}
            </div>

            {aba === 'dashboard' && <Dashboard dados={dashboard} />}

            {aba === 'agenda' && (
                <PainelAgenda
                    data={dataOperacao}
                    agendamentos={agendamentos}
                    onData={setDataOperacao}
                    onStatus={alterarStatus}
                />
            )}

            {aba === 'clientes' && (
                <PainelClientes
                    cliente={cliente}
                    clientes={clientes}
                    historico={historico}
                    onChange={setCliente}
                    onSalvar={salvarCliente}
                    onNovo={() => setCliente(clienteVazio)}
                    onEditar={setCliente}
                    onExcluir={excluirCliente}
                    onHistorico={carregarHistorico}
                />
            )}

            {aba === 'financeiro' && (
                <PainelFinanceiro
                    lancamento={lancamento}
                    lancamentos={lancamentos}
                    inicio={inicioRelatorio}
                    fim={fimRelatorio}
                    onChange={setLancamento}
                    onInicio={setInicioRelatorio}
                    onFim={setFimRelatorio}
                    onSalvar={salvarLancamento}
                    onExcluir={excluirLancamento}
                />
            )}

            {aba === 'relatorios' && (
                <PainelRelatorios
                    relatorio={relatorio}
                    inicio={inicioRelatorio}
                    fim={fimRelatorio}
                    onInicio={setInicioRelatorio}
                    onFim={setFimRelatorio}
                />
            )}

            {aba === 'relacionamento' && (
                <PainelRelacionamento
                    dados={relacionamento}
                    clientes={clientes}
                    lembrete={lembrete}
                    onChange={setLembrete}
                    onSalvar={salvarLembrete}
                    onStatus={alterarStatusLembrete}
                />
            )}

            {aba === 'servicos' && (
                <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <FormularioServico
                        servico={servico}
                        onChange={setServico}
                        onSubmit={salvarServico}
                        onNovo={() => setServico(servicoVazio)}
                    />
                    <ListaServicos servicos={servicos} onEditar={setServico} onExcluir={excluirServico} />
                </section>
            )}

            {aba === 'profissionais' && (
                <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <FormularioProfissional
                        profissional={profissional}
                        onChange={setProfissional}
                        onSubmit={salvarProfissional}
                        onNovo={() => setProfissional(profissionalVazio)}
                    />
                    <ListaProfissionais
                        profissionais={profissionais}
                        onEditar={setProfissional}
                        onExcluir={excluirProfissional}
                    />
                </section>
            )}

            {mensagem && <span className="text-sm text-zinc-300">{mensagem}</span>}
        </div>
    )
}

function Dashboard({ dados }: { dados: any }) {
    return (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Resumo titulo="Agendamentos hoje" valor={dados?.agendamentosHoje ?? 0} />
            <Resumo titulo="Clientes" valor={dados?.clientes ?? 0} />
            <Resumo titulo="Receita hoje" valor={moeda(dados?.receitaHoje)} />
            <Resumo titulo="Saldo do mês" valor={moeda(dados?.saldoMes)} />
        </section>
    )
}

function PainelAgenda(props: any) {
    return (
        <section className="flex flex-col gap-4">
            <Campo label="Data da agenda" type="date" value={props.data} onChange={props.onData} />
            <div className="grid gap-3">
                {props.agendamentos.map((agendamento: any) => (
                    <div key={agendamento.id} className="rounded border border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h3 className="font-bold text-zinc-100">
                                    {hora(agendamento.data)} - {agendamento.usuario?.nome}
                                </h3>
                                <p className="text-sm text-zinc-400">
                                    {agendamento.profissional?.nome} | {agendamento.servicos?.map((s: any) => s.nome).join(', ')}
                                </p>
                                <p className="text-sm text-zinc-500">{moeda(agendamento.valorTotal)}</p>
                            </div>
                            <select
                                value={agendamento.status}
                                onChange={(e) => props.onStatus(agendamento.id, e.target.value)}
                                className="input lg:w-56"
                            >
                                {statusAgenda.map((status) => (
                                    <option key={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
                {props.agendamentos.length === 0 && <Vazio texto="Nenhum agendamento nesse dia." />}
            </div>
        </section>
    )
}

function PainelClientes(props: any) {
    return (
        <section className="grid gap-6 xl:grid-cols-[360px_320px_1fr]">
            <FormularioBase titulo={props.cliente.id ? 'Editar cliente' : 'Novo cliente'} onSubmit={props.onSalvar} onNovo={props.onNovo}>
                <Campo label="Nome" value={props.cliente.nome} onChange={(nome) => props.onChange({ ...props.cliente, nome })} />
                <Campo label="E-mail" value={props.cliente.email} onChange={(email) => props.onChange({ ...props.cliente, email })} />
                <Campo label="Telefone" value={props.cliente.telefone} onChange={(telefone) => props.onChange({ ...props.cliente, telefone })} />
                <Campo label="Nascimento" type="date" value={props.cliente.dataNascimento} onChange={(dataNascimento) => props.onChange({ ...props.cliente, dataNascimento })} />
                <Campo label={props.cliente.id ? 'Nova senha' : 'Senha'} type="password" value={props.cliente.senha} onChange={(senha) => props.onChange({ ...props.cliente, senha })} />
            </FormularioBase>
            <div className="grid gap-3">
                {props.clientes.map((cliente: any) => (
                    <div key={cliente.id} className="rounded border border-zinc-800 bg-zinc-950 p-4">
                        <button type="button" onClick={() => props.onHistorico(cliente.id)} className="w-full text-left">
                            <h3 className="font-bold text-zinc-100">{cliente.nome}</h3>
                            <p className="text-sm text-zinc-400">{cliente.email}</p>
                            <p className="text-sm text-zinc-500">{cliente.totalAgendamentos} agendamentos</p>
                        </button>
                        <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => props.onEditar({ ...cliente, senha: '' })} className="rounded bg-zinc-800 p-2 text-zinc-200">
                                <IconPencil size={18} />
                            </button>
                            <button type="button" onClick={() => props.onExcluir(cliente.id)} className="rounded bg-red-500/15 p-2 text-red-400">
                                <IconTrash size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {props.clientes.length === 0 && <Vazio texto="Nenhum cliente encontrado." />}
            </div>
            <div className="rounded border border-zinc-800 bg-zinc-950 p-5">
                <h2 className="text-xl font-bold text-zinc-100">
                    {props.historico?.nome ?? 'Histórico do cliente'}
                </h2>
                <div className="mt-4 grid gap-3">
                    {(props.historico?.agendamentos ?? []).map((agendamento: any) => (
                        <div key={agendamento.id} className="rounded border border-zinc-800 p-3">
                            <p className="font-semibold text-zinc-100">
                                {dataHora(agendamento.data)} | {agendamento.status}
                            </p>
                            <p className="text-sm text-zinc-400">
                                {agendamento.profissional?.nome} | {agendamento.servicos.map((s: any) => s.nome).join(', ')}
                            </p>
                        </div>
                    ))}
                    {!props.historico && <Vazio texto="Selecione um cliente para ver o histórico." />}
                </div>
            </div>
        </section>
    )
}

function PainelRelacionamento(props: any) {
    const metricas = props.dados?.metricas ?? {}
    return (
        <section className="flex flex-col gap-6">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <Resumo titulo="Clientes" valor={metricas.totalClientes ?? 0} />
                <Resumo titulo="Atendidos" valor={metricas.clientesAtendidos ?? 0} />
                <Resumo titulo="Recorrentes" valor={metricas.clientesRecorrentes ?? 0} />
                <Resumo titulo="Sem retorno" valor={metricas.clientesSemRetorno ?? 0} />
                <Resumo titulo="Taxa retorno" valor={`${metricas.taxaRetorno ?? 0}%`} />
            </div>

            <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
                <FormularioBase titulo="Novo lembrete" onSubmit={props.onSalvar} onNovo={() => props.onChange(lembreteVazio)}>
                    <label className="flex flex-col gap-2 text-sm text-zinc-400">
                        Tipo
                        <select
                            value={props.lembrete.tipo}
                            onChange={(e) => props.onChange({ ...props.lembrete, tipo: e.target.value })}
                            className="input"
                        >
                            <option value="RETORNO">Retorno</option>
                            <option value="CONFIRMACAO">Confirmação</option>
                            <option value="ANIVERSARIO">Aniversário</option>
                            <option value="FIDELIDADE">Fidelidade</option>
                            <option value="CAMPANHA">Campanha</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-zinc-400">
                        Cliente
                        <select
                            value={props.lembrete.usuarioId}
                            onChange={(e) => props.onChange({ ...props.lembrete, usuarioId: e.target.value })}
                            className="input"
                        >
                            <option value="">Sem cliente específico</option>
                            {props.clientes.map((cliente: any) => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nome}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-zinc-400">
                        Canal
                        <select
                            value={props.lembrete.canal}
                            onChange={(e) => props.onChange({ ...props.lembrete, canal: e.target.value })}
                            className="input"
                        >
                            <option value="WHATSAPP">WhatsApp</option>
                            <option value="EMAIL">E-mail</option>
                            <option value="TELEFONE">Telefone</option>
                        </select>
                    </label>
                    <Campo label="Quando" type="datetime-local" value={props.lembrete.dataPrevista} onChange={(dataPrevista) => props.onChange({ ...props.lembrete, dataPrevista })} />
                    <Campo label="Mensagem" value={props.lembrete.mensagem} onChange={(mensagem) => props.onChange({ ...props.lembrete, mensagem })} />
                </FormularioBase>

                <div className="grid gap-6">
                    <ListaSugestoes itens={props.dados?.sugestoes ?? []} />
                    <ListaConfirmacoes itens={props.dados?.confirmacoesPendentes ?? []} />
                    <ListaLembretes itens={props.dados?.lembretes ?? []} onStatus={props.onStatus} />
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <ListaAniversariantes itens={props.dados?.aniversariantes ?? []} />
                <ListaClientesSemRetorno itens={props.dados?.clientesSemRetorno ?? []} />
            </section>
        </section>
    )
}

function ListaSugestoes(props: { itens: any[] }) {
    return (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold text-zinc-100">Sugestões</h2>
            <div className="mt-4 grid gap-3">
                {props.itens.map((item) => (
                    <div key={item.tipo} className="rounded border border-zinc-800 p-3">
                        <p className="font-semibold text-zinc-100">{item.titulo}</p>
                        <p className="text-sm text-zinc-400">{item.descricao}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ListaConfirmacoes(props: { itens: any[] }) {
    return (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold text-zinc-100">Confirmações próximas</h2>
            <div className="mt-4 grid gap-3">
                {props.itens.map((item) => (
                    <div key={item.id} className="rounded border border-zinc-800 p-3">
                        <p className="font-semibold text-zinc-100">
                            {dataHora(item.data)} | {item.usuario?.nome}
                        </p>
                        <p className="text-sm text-zinc-400">
                            {item.profissional?.nome} | {item.servicos?.map((s: any) => s.nome).join(', ')}
                        </p>
                    </div>
                ))}
                {props.itens.length === 0 && <Vazio texto="Sem confirmações pendentes nas próximas 48 horas." />}
            </div>
        </div>
    )
}

function ListaLembretes(props: { itens: any[]; onStatus: (id: number, status: string) => void }) {
    return (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold text-zinc-100">Lembretes</h2>
            <div className="mt-4 grid gap-3">
                {props.itens.map((item) => (
                    <div key={item.id} className="rounded border border-zinc-800 p-3">
                        <p className="font-semibold text-zinc-100">
                            {item.tipo} | {item.usuario?.nome ?? 'Geral'}
                        </p>
                        <p className="text-sm text-zinc-400">{item.mensagem}</p>
                        <p className="text-sm text-zinc-500">
                            {item.canal} | {dataHora(item.dataPrevista)} | {item.status}
                        </p>
                        <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => props.onStatus(item.id, 'ENVIADO')} className="rounded bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-300">
                                Enviado
                            </button>
                            <button type="button" onClick={() => props.onStatus(item.id, 'CANCELADO')} className="rounded bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-300">
                                Cancelar
                            </button>
                        </div>
                    </div>
                ))}
                {props.itens.length === 0 && <Vazio texto="Nenhum lembrete pendente." />}
            </div>
        </div>
    )
}

function ListaAniversariantes(props: { itens: any[] }) {
    return (
        <ListaSimples
            titulo="Aniversariantes"
            vazio="Nenhum aniversário nos próximos 30 dias."
            itens={props.itens}
            detalhe={(item) => `${data(item.proximoAniversario)} | faltam ${item.diasAteAniversario} dia(s)`}
        />
    )
}

function ListaClientesSemRetorno(props: { itens: any[] }) {
    return (
        <ListaSimples
            titulo="Clientes sem retorno"
            vazio="Nenhum cliente acima do limite de retorno."
            itens={props.itens}
            detalhe={(item) => `Último atendimento em ${data(item.ultimoAtendimento)} | ${item.diasSemRetorno} dia(s)`}
        />
    )
}

function ListaSimples(props: {
    titulo: string
    vazio: string
    itens: any[]
    detalhe: (item: any) => string
}) {
    return (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold text-zinc-100">{props.titulo}</h2>
            <div className="mt-4 grid gap-3">
                {props.itens.map((item) => (
                    <div key={item.id} className="rounded border border-zinc-800 p-3">
                        <p className="font-semibold text-zinc-100">{item.nome}</p>
                        <p className="text-sm text-zinc-400">{props.detalhe(item)}</p>
                        {item.telefone && <p className="text-sm text-zinc-500">{item.telefone}</p>}
                    </div>
                ))}
                {props.itens.length === 0 && <Vazio texto={props.vazio} />}
            </div>
        </div>
    )
}

function PainelFinanceiro(props: any) {
    return (
        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <FormularioBase titulo="Novo lançamento" onSubmit={props.onSalvar} onNovo={() => props.onChange(lancamentoVazio)}>
                <label className="flex flex-col gap-2 text-sm text-zinc-400">
                    Tipo
                    <select
                        value={props.lancamento.tipo}
                        onChange={(e) => props.onChange({ ...props.lancamento, tipo: e.target.value })}
                        className="input"
                    >
                        <option value="RECEITA">Receita</option>
                        <option value="DESPESA">Despesa</option>
                    </select>
                </label>
                <Campo label="Descrição" value={props.lancamento.descricao} onChange={(descricao) => props.onChange({ ...props.lancamento, descricao })} />
                <Campo label="Categoria" value={props.lancamento.categoria} onChange={(categoria) => props.onChange({ ...props.lancamento, categoria })} />
                <Campo label="Valor" type="number" value={props.lancamento.valor} onChange={(valor) => props.onChange({ ...props.lancamento, valor })} />
                <Campo label="Data" type="date" value={props.lancamento.data} onChange={(data) => props.onChange({ ...props.lancamento, data })} />
            </FormularioBase>
            <div className="flex flex-col gap-4">
                <FiltroPeriodo {...props} />
                <div className="grid gap-3">
                    {props.lancamentos.map((item: any) => (
                        <Linha
                            key={item.id}
                            titulo={`${item.tipo === 'DESPESA' ? 'Despesa' : 'Receita'} - ${item.descricao}`}
                            detalhe={`${dataHora(item.data)} | ${moeda(item.valor)}`}
                            onEditar={() => {}}
                            onExcluir={() => props.onExcluir(item.id)}
                            esconderEditar
                        />
                    ))}
                    {props.lancamentos.length === 0 && <Vazio texto="Nenhum lançamento no período." />}
                </div>
            </div>
        </section>
    )
}

function PainelRelatorios(props: any) {
    const totais = props.relatorio?.totais ?? {}
    return (
        <section className="flex flex-col gap-6">
            <FiltroPeriodo {...props} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <Resumo titulo="Agendamentos" valor={totais.agendamentos ?? 0} />
                <Resumo titulo="Atendidos" valor={totais.atendimentosConcluidos ?? 0} />
                <Resumo titulo="Receitas" valor={moeda(totais.receitas)} />
                <Resumo titulo="Despesas" valor={moeda(totais.despesas)} />
                <Resumo titulo="Saldo" valor={moeda(totais.saldo)} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <ListaRelatorio titulo="Comissões" itens={props.relatorio?.comissoes ?? []} tipo="comissao" />
                <ListaRelatorio titulo="Serviços vendidos" itens={props.relatorio?.servicos ?? []} tipo="servico" />
            </div>
        </section>
    )
}

function ListaRelatorio(props: { titulo: string; itens: any[]; tipo: 'comissao' | 'servico' }) {
    return (
        <div className="rounded border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-xl font-bold text-zinc-100">{props.titulo}</h2>
            <div className="mt-4 grid gap-3">
                {props.itens.map((item) => (
                    <div key={item.profissionalId ?? item.servicoId} className="rounded border border-zinc-800 p-3">
                        <p className="font-semibold text-zinc-100">{item.profissional ?? item.servico}</p>
                        <p className="text-sm text-zinc-400">
                            {props.tipo === 'comissao'
                                ? `${moeda(item.receita)} | comissão ${moeda(item.comissao)}`
                                : `${item.quantidade} vendas | ${moeda(item.receita)}`}
                        </p>
                    </div>
                ))}
                {props.itens.length === 0 && <Vazio texto="Sem dados no período." />}
            </div>
        </div>
    )
}

function FiltroPeriodo(props: any) {
    return (
        <div className="grid gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-2">
            <Campo label="Início" type="date" value={props.inicio} onChange={props.onInicio} />
            <Campo label="Fim" type="date" value={props.fim} onChange={props.onFim} />
        </div>
    )
}

function FormularioServico(props: any) {
    return (
        <FormularioBase
            titulo={props.servico.id ? 'Editar serviço' : 'Novo serviço'}
            onSubmit={props.onSubmit}
            onNovo={props.onNovo}
        >
            <Campo label="Nome" value={props.servico.nome} onChange={(nome) => props.onChange({ ...props.servico, nome })} />
            <Campo label="Descrição" value={props.servico.descricao} onChange={(descricao) => props.onChange({ ...props.servico, descricao })} />
            <Campo label="Imagem" value={props.servico.imagemURL} onChange={(imagemURL) => props.onChange({ ...props.servico, imagemURL })} />
            <Campo label="Preço" type="number" value={props.servico.preco} onChange={(preco) => props.onChange({ ...props.servico, preco })} />
            <Campo label="Slots de 15 min" type="number" value={props.servico.qtdeSlots} onChange={(qtdeSlots) => props.onChange({ ...props.servico, qtdeSlots })} />
        </FormularioBase>
    )
}

function FormularioProfissional(props: any) {
    return (
        <FormularioBase
            titulo={props.profissional.id ? 'Editar profissional' : 'Novo profissional'}
            onSubmit={props.onSubmit}
            onNovo={props.onNovo}
        >
            <Campo label="Nome" value={props.profissional.nome} onChange={(nome) => props.onChange({ ...props.profissional, nome })} />
            <Campo label="Descrição" value={props.profissional.descricao} onChange={(descricao) => props.onChange({ ...props.profissional, descricao })} />
            <Campo label="Imagem" value={props.profissional.imagemURL} onChange={(imagemURL) => props.onChange({ ...props.profissional, imagemURL })} />
            <Campo label="Avaliação" type="number" value={props.profissional.avaliacao} onChange={(avaliacao) => props.onChange({ ...props.profissional, avaliacao })} />
        </FormularioBase>
    )
}

function FormularioBase(props: any) {
    return (
        <div className="flex flex-col gap-4 rounded border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-100">{props.titulo}</h2>
                <button type="button" onClick={props.onNovo} className="rounded bg-zinc-800 p-2 text-zinc-200">
                    <IconPlus size={18} />
                </button>
            </div>
            {props.children}
            <button type="button" onClick={props.onSubmit} className="rounded bg-yellow-400 px-4 py-3 font-semibold text-black">
                Salvar
            </button>
        </div>
    )
}

function Campo(props: {
    label: string
    value: any
    type?: string
    onChange: (valor: string) => void
}) {
    return (
        <label className="flex flex-col gap-2 text-sm text-zinc-400">
            {props.label}
            <input
                type={props.type ?? 'text'}
                value={props.value ?? ''}
                onChange={(e) => props.onChange(e.target.value)}
                className="input"
            />
        </label>
    )
}

function ListaServicos(props: {
    servicos: Servico[]
    onEditar: (servico: Servico) => void
    onExcluir: (id: number) => void
}) {
    return (
        <div className="grid gap-3">
            {props.servicos.map((servico) => (
                <Linha
                    key={servico.id}
                    titulo={servico.nome}
                    detalhe={`R$ ${Number(servico.preco).toFixed(2)} | ${servico.qtdeSlots * 15} min`}
                    onEditar={() => props.onEditar(servico)}
                    onExcluir={() => props.onExcluir(servico.id)}
                />
            ))}
        </div>
    )
}

function ListaProfissionais(props: {
    profissionais: Profissional[]
    onEditar: (profissional: Profissional) => void
    onExcluir: (id: number) => void
}) {
    return (
        <div className="grid gap-3">
            {props.profissionais.map((profissional) => (
                <Linha
                    key={profissional.id}
                    titulo={profissional.nome}
                    detalhe={`${profissional.avaliacao.toFixed(1)} | ${profissional.quantidadeAvaliacoes} avaliações`}
                    onEditar={() => props.onEditar(profissional)}
                    onExcluir={() => props.onExcluir(profissional.id)}
                />
            ))}
        </div>
    )
}

function Linha(props: {
    titulo: string
    detalhe: string
    onEditar: () => void
    onExcluir: () => void
    esconderEditar?: boolean
}) {
    return (
        <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 p-4">
            <div className="min-w-0">
                <h3 className="truncate font-bold text-zinc-100">{props.titulo}</h3>
                <p className="text-sm text-zinc-400">{props.detalhe}</p>
            </div>
            <div className="flex gap-2">
                {!props.esconderEditar && (
                    <button type="button" onClick={props.onEditar} className="rounded bg-zinc-800 p-2 text-zinc-200">
                        <IconPencil size={18} />
                    </button>
                )}
                <button type="button" onClick={props.onExcluir} className="rounded bg-red-500/15 p-2 text-red-400">
                    <IconTrash size={18} />
                </button>
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

function Vazio(props: { texto: string }) {
    return <p className="rounded border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">{props.texto}</p>
}

function botaoAba(ativo: boolean) {
    return [
        'rounded px-4 py-2 font-semibold',
        ativo ? 'bg-yellow-400 text-black' : 'bg-zinc-900 text-zinc-300',
    ].join(' ')
}

function moeda(valor: any) {
    return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function hora(valor: string) {
    return new Date(valor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function dataHora(valor: string) {
    return new Date(valor).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function data(valor: string) {
    return new Date(valor).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}
