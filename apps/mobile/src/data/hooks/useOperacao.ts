import type {
    AgendamentoOperacional, DashboardOperacional, EscalaProfissional, IndisponibilidadeRecurso, MembroEquipe,
    PermissaoEquipe, ProfissionalOperacional, RecursoOperacional, UsuarioEquipe,
    RespostaAgendaOperacional, VisualizacaoAgenda,
    FiltrosAgendaOperacional, RestricaoAgendaOperacional,
} from '../operacao/tipos'
import useAPI, { mensagemDoErro } from './useAPI'
import useSessao from './useSessao'
import { useCallback, useEffect, useRef, useState } from 'react'

const CACHE_AGENDA = new Map<string, { resposta: RespostaAgendaOperacional; salvoEm: number }>()
const CACHE_AGENDA_MS = 5 * 60_000

const dataLocal = (data: Date) => {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
}
const hoje = () => dataLocal(new Date())

const intervaloDaAgenda = (data: string, visualizacao: VisualizacaoAgenda) => {
    const inicio = new Date(`${data}T00:00:00`)
    if (visualizacao === 'week') {
        const distanciaSegunda = (inicio.getDay() + 6) % 7
        inicio.setDate(inicio.getDate() - distanciaSegunda)
    }
    const fim = new Date(inicio)
    const dias = visualizacao === 'day' ? 1 : visualizacao === '3days' ? 3 : visualizacao === 'week' ? 7 : 31
    fim.setDate(fim.getDate() + dias)
    return { inicio: inicio.toISOString(), fim: fim.toISOString() }
}

const filtrosIniciais: FiltrosAgendaOperacional = { profissionalId: null, recursoId: null, status: null }

export default function useOperacao(visualizacaoAgenda: VisualizacaoAgenda = 'day') {
    const { httpDelete, httpGet, httpPost, httpPut } = useAPI()
    const { usuario } = useSessao()
    const [dashboard, setDashboard] = useState<DashboardOperacional | null>(null)
    const [agendamentos, setAgendamentos] = useState<AgendamentoOperacional[]>([])
    const [restricoesAgenda, setRestricoesAgenda] = useState<RestricaoAgendaOperacional[]>([])
    const [filtrosAgenda, setFiltrosAgenda] = useState<FiltrosAgendaOperacional>(filtrosIniciais)
    const [profissionais, setProfissionais] = useState<ProfissionalOperacional[]>([])
    const [membros, setMembros] = useState<MembroEquipe[]>([])
    const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<UsuarioEquipe[]>([])
    const [recursos, setRecursos] = useState<RecursoOperacional[]>([])
    const [permissoes, setPermissoes] = useState<PermissaoEquipe[]>([])
    const [data, setData] = useState(hoje())
    const [fusoHorario, setFusoHorario] = useState('America/Sao_Paulo')
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const inicializado = useRef(false)
    const revisaoAgenda = useRef<number | null>(null)

    const consultarAgenda = useCallback(async (forcar = false) => {
        const periodo = intervaloDaAgenda(data, visualizacaoAgenda)
        const parametros = new URLSearchParams({ inicio: periodo.inicio, fim: periodo.fim })
        if (filtrosAgenda.profissionalId) parametros.set('profissionalId', String(filtrosAgenda.profissionalId))
        if (filtrosAgenda.recursoId) parametros.set('recursoId', String(filtrosAgenda.recursoId))
        if (filtrosAgenda.status) parametros.set('status', filtrosAgenda.status)
        const consulta = parametros.toString()
        const chave = `${usuario?.estabelecimentoId ?? 'sem-estabelecimento'}:${consulta}`
        const cache = CACHE_AGENDA.get(chave)
        if (!forcar && cache && Date.now() - cache.salvoEm < CACHE_AGENDA_MS) return cache.resposta
        const resposta = await httpGet<RespostaAgendaOperacional>(`/gestao/agenda?${consulta}`)
        CACHE_AGENDA.set(chave, { resposta, salvoEm: Date.now() })
        return resposta
    }, [data, filtrosAgenda.profissionalId, filtrosAgenda.recursoId, filtrosAgenda.status, httpGet, usuario?.estabelecimentoId, visualizacaoAgenda])

    const carregar = useCallback(async () => {
        try {
            if (!inicializado.current) setCarregando(true)
            setErro(null)
            const acessos = await httpGet<PermissaoEquipe[]>('/equipe/minhas-permissoes')
            setPermissoes(acessos)
            const pode = (permissao: PermissaoEquipe) => acessos.includes(permissao)
            const [resumo, agenda, equipe, membrosEquipe, usuarios, recursosEquipe] = await Promise.all([
                pode('AGENDA_GERENCIAR') ? httpGet<DashboardOperacional>('/gestao/dashboard') : Promise.resolve(null),
                pode('AGENDA_GERENCIAR')
                    ? consultarAgenda()
                    : Promise.resolve(null),
                httpGet<ProfissionalOperacional[]>('/profissionais'),
                pode('EQUIPE_GERENCIAR') ? httpGet<MembroEquipe[]>('/equipe') : Promise.resolve([]),
                pode('EQUIPE_GERENCIAR') ? httpGet<UsuarioEquipe[]>('/equipe/usuarios-disponiveis') : Promise.resolve([]),
                pode('RECURSOS_GERENCIAR') ? httpGet<RecursoOperacional[]>('/recursos') : Promise.resolve([]),
            ])
            setDashboard(resumo); setAgendamentos(agenda?.itens ?? []); setRestricoesAgenda(agenda?.restricoes ?? []); setFusoHorario(agenda?.periodo.fusoHorario ?? 'America/Sao_Paulo'); setProfissionais(equipe)
            setMembros(membrosEquipe); setUsuariosDisponiveis(usuarios); setRecursos(recursosEquipe)
        } catch (e) { setErro(mensagemDoErro(e)) } finally { inicializado.current = true; setCarregando(false) }
    }, [consultarAgenda, httpGet])

    useEffect(() => { carregar() }, [carregar])

    useEffect(() => {
        const sincronizar = async () => {
            try {
                const atual = await httpGet<{ revisao: number }>('/gestao/agenda/revisao')
                if (revisaoAgenda.current === null) revisaoAgenda.current = atual.revisao
                else if (atual.revisao !== revisaoAgenda.current) {
                    revisaoAgenda.current = atual.revisao
                    CACHE_AGENDA.clear()
                    const agenda = await consultarAgenda(true)
                    setAgendamentos(agenda.itens); setRestricoesAgenda(agenda.restricoes); setFusoHorario(agenda.periodo.fusoHorario)
                }
            } catch { /* a sincronização volta a tentar sem interromper a agenda */ }
        }
        const intervalo = setInterval(() => { void sincronizar() }, 5_000)
        return () => clearInterval(intervalo)
    }, [consultarAgenda, httpGet])

    async function executarAcao(acao: () => Promise<unknown>, somenteAgenda = false) {
        try {
            setErro(null)
            await acao()
            CACHE_AGENDA.clear()
            if (somenteAgenda) {
                const agenda = await consultarAgenda(true)
                setAgendamentos(agenda.itens); setRestricoesAgenda(agenda.restricoes); setFusoHorario(agenda.periodo.fusoHorario)
            } else await carregar()
            return true
        } catch (e) {
            setErro(mensagemDoErro(e))
            return false
        }
    }

    async function alterarStatus(id: number, status: string) {
        const anteriores = agendamentos
        setAgendamentos((atuais) => atuais.map((item) => item.id === id ? { ...item, status } : item))
        const sucesso = await executarAcao(() => httpPut(`/gestao/agendamentos/${id}/status`, { status }), true)
        if (!sucesso) setAgendamentos(anteriores)
        return sucesso
    }
    async function reagendar(item: AgendamentoOperacional, novaData: string, motivo?: string) {
        if (!item.profissional?.id || !item.servicos?.length) {
            setErro('O agendamento não possui profissional e serviços suficientes para reagendar.')
            return false
        }
        const anteriores = agendamentos
        const diferenca = new Date(novaData).getTime() - new Date(item.data).getTime()
        setAgendamentos((atuais) => atuais.map((atual) => atual.id === item.id
            ? deslocarAgendamento(atual, novaData, diferenca) : atual))
        const sucesso = await executarAcao(async () => {
            const disponibilidade = await httpPost<{ disponivel: boolean; motivo?: string }>('/agenda/disponibilidade', {
                data: novaData,
                profissionalId: item.profissional!.id,
                servicoIds: item.servicos!.map((servico) => servico.id),
                unidadeId: item.unidade?.id ?? null,
                modeloAtendimento: item.modeloAtendimento ?? 'PRESENCIAL',
                enderecoAtendimento: item.enderecoAtendimento,
                deslocamentoMinutos: item.deslocamentoMinutos ?? 0,
                agendamentoIgnoradoId: item.id,
            })
            if (!disponibilidade.disponivel) throw new Error(disponibilidade.motivo ?? 'Horário indisponível')
            await httpPut(`/agendamentos/${item.id}/reagendar`, {
                data: novaData,
                unidadeId: item.unidade?.id ?? null,
                enderecoAtendimento: item.enderecoAtendimento,
                deslocamentoMinutos: item.deslocamentoMinutos ?? 0,
                motivo: motivo?.trim() || null,
            })
        }, true)
        if (!sucesso) setAgendamentos(anteriores)
        return sucesso
    }
    async function criarProfissional(dados: Omit<ProfissionalOperacional, 'id'>) {
        const { midiaId, ...campos } = dados
        let pendencia: string | null = null
        const sucesso = await executarAcao(async () => {
            const profissional = await httpPost<ProfissionalOperacional>('/profissionais', { ...campos, avaliacao: 5, quantidadeAvaliacoes: 0 })
            if (midiaId !== undefined) {
                try { await httpPut('/midias/associacao', { entidade: 'PROFISSIONAL', entidadeId: profissional.id, midiaId }) }
                catch (e) { pendencia = `Profissional salvo. Revise a foto na equipe: ${mensagemDoErro(e)}` }
            }
        })
        if (pendencia) setErro(pendencia)
        return sucesso
    }
    async function salvarMembro(dados: { usuarioId: number; profissionalId?: number | null; papel: string; permissoes: PermissaoEquipe[]; ativo?: boolean }, membroId?: number) {
        return executarAcao(() => membroId ? httpPut(`/equipe/${membroId}`, dados) : httpPost('/equipe', dados))
    }
    async function criarPerfilParaMembro(membro: MembroEquipe) {
        return executarAcao(async () => {
            const profissional = await httpPost<ProfissionalOperacional>('/profissionais', {
                nome: membro.usuario.nome,
                descricao: `Atendimento realizado por ${membro.usuario.nome}`,
                imagemURL: '/profissionais/profissional-1.jpg',
                avaliacao: 5,
                quantidadeAvaliacoes: 0,
            })
            await httpPut(`/equipe/${membro.id}`, {
                usuarioId: membro.usuarioId,
                profissionalId: profissional.id,
                papel: membro.papel,
                permissoes: membro.permissoes,
                ativo: membro.ativo,
            })
        })
    }
    const removerMembro = (id: number) => executarAcao(() => httpDelete(`/equipe/${id}`))
    const buscarEscalas = (profissionalId: number) => httpGet<EscalaProfissional[]>(`/equipe/profissionais/${profissionalId}/escalas`)
    const salvarEscalas = (profissionalId: number, escalas: EscalaProfissional[]) => executarAcao(() => httpPut(`/equipe/profissionais/${profissionalId}/escalas`, { escalas }))
    const criarRecurso = (dados: Omit<RecursoOperacional, 'id'>) => executarAcao(() => httpPost('/recursos', dados))
    const indisponibilizarRecurso = (id: number, dados: { inicio: string; fim: string; motivo?: string }) => executarAcao(() => httpPost(`/recursos/${id}/indisponibilidades`, dados))
    const buscarIndisponibilidades = (id: number) => httpGet<IndisponibilidadeRecurso[]>(`/recursos/${id}/indisponibilidades`)
    const removerIndisponibilidade = (recursoId: number, id: number) => executarAcao(() => httpDelete(`/recursos/${recursoId}/indisponibilidades/${id}`))

    return {
        dashboard, agendamentos, restricoesAgenda, filtrosAgenda, setFiltrosAgenda, profissionais, membros, usuariosDisponiveis, recursos, permissoes, data, setData, fusoHorario, carregando, erro,
        recarregar: carregar, alterarStatus, reagendar, criarProfissional, salvarMembro, criarPerfilParaMembro, removerMembro,
        buscarEscalas, salvarEscalas, criarRecurso, buscarIndisponibilidades, indisponibilizarRecurso, removerIndisponibilidade,
    }
}

function deslocarAgendamento(item: AgendamentoOperacional, data: string, diferenca: number): AgendamentoOperacional {
    const deslocar = (valor?: string | null) => valor ? new Date(new Date(valor).getTime() + diferenca).toISOString() : valor
    const periodos = item.periodos ? Object.fromEntries(Object.entries(item.periodos).map(([chave, periodo]) => [
        chave,
        periodo ? { inicio: deslocar(periodo.inicio)!, fim: deslocar(periodo.fim)! } : null,
    ])) as AgendamentoOperacional['periodos'] : item.periodos
    return { ...item, data, dataFim: deslocar(item.dataFim), inicioOcupacao: deslocar(item.inicioOcupacao), fimOcupacao: deslocar(item.fimOcupacao), periodos }
}
