import type {
    AgendamentoOperacional, DashboardOperacional, EscalaProfissional, IndisponibilidadeRecurso, MembroEquipe,
    PermissaoEquipe, ProfissionalOperacional, RecursoOperacional, UsuarioEquipe,
    NovaContaMembro,
    RespostaAgendaOperacional, VisualizacaoAgenda,
    FiltrosAgendaOperacional, RestricaoAgendaOperacional,
} from '../operacao/tipos'
import useSincronizacaoAtendimentos, { EVENTO_ATENDIMENTOS } from './useSincronizacaoAtendimentos'
import { DeviceEventEmitter } from 'react-native'
import { intervaloDiaAtendimento } from '@uniflowabs/core'
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

const intervaloDaAgenda = (data: string, visualizacao: VisualizacaoAgenda, fuso: string) => {
    const inicio = new Date(`${data}T12:00:00Z`)
    if (visualizacao === 'week') {
        const distanciaSegunda = (inicio.getUTCDay() + 6) % 7
        inicio.setUTCDate(inicio.getUTCDate() - distanciaSegunda)
    }
    const fim = new Date(inicio)
    const dias = visualizacao === 'day' ? 1 : visualizacao === '3days' ? 3 : visualizacao === 'week' ? 7 : 31
    fim.setUTCDate(fim.getUTCDate() + dias)
    return {
        inicio: intervaloDiaAtendimento(inicio.toISOString().slice(0, 10), fuso).inicio,
        fim: intervaloDiaAtendimento(fim.toISOString().slice(0, 10), fuso).inicio,
    }
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
    const consultaAtual = useRef(0)
    const cargaAtual = useRef(0)

    const consultarAgenda = useCallback(async (forcar = false) => {
        const periodo = intervaloDaAgenda(data, visualizacaoAgenda, fusoHorario)
        const parametros = new URLSearchParams({ inicio: periodo.inicio, fim: periodo.fim })
        if (filtrosAgenda.profissionalId) parametros.set('profissionalId', String(filtrosAgenda.profissionalId))
        if (filtrosAgenda.recursoId) parametros.set('recursoId', String(filtrosAgenda.recursoId))
        if (filtrosAgenda.status) parametros.set('status', filtrosAgenda.status)
        const consulta = parametros.toString()
        const chave = `${usuario?.id}:${usuario?.estabelecimentoId ?? 'sem-estabelecimento'}:${consulta}`
        const cache = CACHE_AGENDA.get(chave)
        if (!forcar && cache && Date.now() - cache.salvoEm < CACHE_AGENDA_MS) return cache.resposta
        parametros.set('limite', '200')
        let resposta = await httpGet<RespostaAgendaOperacional>(`/gestao/agenda?${parametros}`)
        const itens = [...resposta.itens]
        const cursores = new Set<string>()
        while (resposta.pagina.temMais && resposta.pagina.proximoCursor && !cursores.has(resposta.pagina.proximoCursor)) {
            cursores.add(resposta.pagina.proximoCursor)
            parametros.set('cursor', resposta.pagina.proximoCursor)
            resposta = await httpGet<RespostaAgendaOperacional>(`/gestao/agenda?${parametros}`)
            itens.push(...resposta.itens)
        }
        resposta = { ...resposta, itens: Array.from(new Map(itens.map((item) => [item.id, item])).values()) }
        CACHE_AGENDA.set(chave, { resposta, salvoEm: Date.now() })
        return resposta
    }, [data, filtrosAgenda.profissionalId, filtrosAgenda.recursoId, filtrosAgenda.status, fusoHorario, httpGet, usuario?.id, usuario?.estabelecimentoId, visualizacaoAgenda])

    const carregar = useCallback(async () => {
        const ticket = ++cargaAtual.current
        const ticketAgenda = ++consultaAtual.current
        try {
            if (!inicializado.current) setCarregando(true)
            setErro(null)
            const acessos = await httpGet<PermissaoEquipe[]>('/equipe/minhas-permissoes')
            if (ticket !== cargaAtual.current) return
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
            if (ticket !== cargaAtual.current) return
            setDashboard(resumo); setProfissionais(equipe)
            if (ticketAgenda === consultaAtual.current) {
                setAgendamentos(agenda?.itens ?? []); setRestricoesAgenda(agenda?.restricoes ?? []); setFusoHorario(agenda?.periodo.fusoHorario ?? 'America/Sao_Paulo')
            }
            setMembros(membrosEquipe); setUsuariosDisponiveis(usuarios); setRecursos(recursosEquipe)
        } catch (e) { if (ticket === cargaAtual.current) setErro(mensagemDoErro(e)) } finally { if (ticket === cargaAtual.current) { inicializado.current = true; setCarregando(false) } }
    }, [consultarAgenda, httpGet])

    useEffect(() => {
        setAgendamentos([]); setRestricoesAgenda([]); setPermissoes([]); setDashboard(null)
        CACHE_AGENDA.clear()
    }, [usuario?.id, usuario?.estabelecimentoId])

    useEffect(() => {
        void carregar()
        return () => { cargaAtual.current++; consultaAtual.current++ }
    }, [carregar])

    const atualizarAgenda = useCallback(async () => {
        const ticket = ++consultaAtual.current
        try {
            const agenda = await consultarAgenda(true)
            if (ticket !== consultaAtual.current) return false
            setAgendamentos(agenda.itens); setRestricoesAgenda(agenda.restricoes); setFusoHorario(agenda.periodo.fusoHorario); setErro(null)
            return true
        } catch (e) { if (ticket === consultaAtual.current) setErro(mensagemDoErro(e)); return false }
    }, [consultarAgenda])
    useSincronizacaoAtendimentos(atualizarAgenda, permissoes.includes('AGENDA_GERENCIAR'))

    async function executarAcao(acao: () => Promise<unknown>, somenteAgenda = false) {
        try {
            setErro(null)
            await acao()
            DeviceEventEmitter.emit(EVENTO_ATENDIMENTOS)
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
    const criarContaMembro = (dados: NovaContaMembro) => executarAcao(() => httpPost('/equipe/com-conta', dados))
    async function criarPerfilParaMembro(membro: MembroEquipe, sexo: 'MASCULINO' | 'FEMININO') {
        return executarAcao(async () => {
            const profissional = await httpPost<ProfissionalOperacional>('/profissionais', {
                nome: membro.usuario.nome,
                sexo,
                descricao: `Atendimento realizado por ${membro.usuario.nome}`,
                imagemURL: `/profissionais/avatar-${sexo === 'FEMININO' ? 'feminino' : 'masculino'}.png`,
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
    const salvarEscalas = (profissionalId: number, escalas: EscalaProfissional[]) => executarAcao(() => httpPut(`/equipe/profissionais/${profissionalId}/escalas`, {
        escalas: escalas.map(({ unidadeId, diaSemana, inicio, fim, intervaloInicio, intervaloFim, ativo }) => ({
            unidadeId: unidadeId ?? null, diaSemana, inicio: inicio.trim(), fim: fim.trim(),
            intervaloInicio: intervaloInicio?.trim() || null, intervaloFim: intervaloFim?.trim() || null,
            ativo: ativo ?? true,
        })),
    }))
    const criarRecurso = (dados: Omit<RecursoOperacional, 'id'>) => executarAcao(() => httpPost('/recursos', dados))
    const indisponibilizarRecurso = (id: number, dados: { inicio: string; fim: string; motivo?: string }) => executarAcao(() => httpPost(`/recursos/${id}/indisponibilidades`, dados))
    const buscarIndisponibilidades = (id: number) => httpGet<IndisponibilidadeRecurso[]>(`/recursos/${id}/indisponibilidades`)
    const removerIndisponibilidade = (recursoId: number, id: number) => executarAcao(() => httpDelete(`/recursos/${recursoId}/indisponibilidades/${id}`))

    return {
        dashboard, agendamentos, restricoesAgenda, filtrosAgenda, setFiltrosAgenda, profissionais, membros, usuariosDisponiveis, recursos, permissoes, data, setData, fusoHorario, carregando, erro,
        recarregar: carregar, reagendar, criarProfissional, salvarMembro, criarContaMembro, criarPerfilParaMembro, removerMembro,
        buscarEscalas, salvarEscalas, criarRecurso, buscarIndisponibilidades, indisponibilizarRecurso, removerIndisponibilidade,
    }
}

function deslocarAgendamento(item: AgendamentoOperacional, data: string, diferenca: number): AgendamentoOperacional {
    const deslocar = (valor?: string | null) => valor ? new Date(new Date(valor).getTime() + diferenca).toISOString() : valor
    const deslocarPeriodo = (periodo?: { inicio: string; fim: string } | null) => periodo
        ? { inicio: deslocar(periodo.inicio)!, fim: deslocar(periodo.fim)! }
        : null
    const periodos = item.periodos ? {
        ocupacao: deslocarPeriodo(item.periodos.ocupacao)!,
        deslocamentoAntes: deslocarPeriodo(item.periodos.deslocamentoAntes),
        preparacaoAntes: deslocarPeriodo(item.periodos.preparacaoAntes),
        atendimento: deslocarPeriodo(item.periodos.atendimento)!,
        preparacaoDepois: deslocarPeriodo(item.periodos.preparacaoDepois),
        deslocamentoDepois: deslocarPeriodo(item.periodos.deslocamentoDepois),
    } : undefined
    return { ...item, data, dataFim: deslocar(item.dataFim), inicioOcupacao: deslocar(item.inicioOcupacao), fimOcupacao: deslocar(item.fimOcupacao), periodos }
}
