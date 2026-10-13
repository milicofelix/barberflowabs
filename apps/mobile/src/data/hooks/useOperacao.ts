import type {
    AgendamentoOperacional, DashboardOperacional, EscalaProfissional, IndisponibilidadeRecurso, MembroEquipe,
    PermissaoEquipe, ProfissionalOperacional, RecursoOperacional, UsuarioEquipe,
    RespostaAgendaOperacional, VisualizacaoAgenda,
} from '../operacao/tipos'
import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useState } from 'react'

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

export default function useOperacao(visualizacaoAgenda: VisualizacaoAgenda = 'day') {
    const { httpDelete, httpGet, httpPost, httpPut } = useAPI()
    const [dashboard, setDashboard] = useState<DashboardOperacional | null>(null)
    const [agendamentos, setAgendamentos] = useState<AgendamentoOperacional[]>([])
    const [profissionais, setProfissionais] = useState<ProfissionalOperacional[]>([])
    const [membros, setMembros] = useState<MembroEquipe[]>([])
    const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<UsuarioEquipe[]>([])
    const [recursos, setRecursos] = useState<RecursoOperacional[]>([])
    const [permissoes, setPermissoes] = useState<PermissaoEquipe[]>([])
    const [data, setData] = useState(hoje())
    const [fusoHorario, setFusoHorario] = useState('America/Sao_Paulo')
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const carregar = useCallback(async () => {
        try {
            setCarregando(true); setErro(null)
            const acessos = await httpGet<PermissaoEquipe[]>('/equipe/minhas-permissoes')
            setPermissoes(acessos)
            const pode = (permissao: PermissaoEquipe) => acessos.includes(permissao)
            const periodo = intervaloDaAgenda(data, visualizacaoAgenda)
            const [resumo, agenda, equipe, membrosEquipe, usuarios, recursosEquipe] = await Promise.all([
                pode('AGENDA_GERENCIAR') ? httpGet<DashboardOperacional>('/gestao/dashboard') : Promise.resolve(null),
                pode('AGENDA_GERENCIAR')
                    ? httpGet<RespostaAgendaOperacional>(`/gestao/agenda?inicio=${encodeURIComponent(periodo.inicio)}&fim=${encodeURIComponent(periodo.fim)}`)
                    : Promise.resolve(null),
                httpGet<ProfissionalOperacional[]>('/profissionais'),
                pode('EQUIPE_GERENCIAR') ? httpGet<MembroEquipe[]>('/equipe') : Promise.resolve([]),
                pode('EQUIPE_GERENCIAR') ? httpGet<UsuarioEquipe[]>('/equipe/usuarios-disponiveis') : Promise.resolve([]),
                pode('RECURSOS_GERENCIAR') ? httpGet<RecursoOperacional[]>('/recursos') : Promise.resolve([]),
            ])
            setDashboard(resumo); setAgendamentos(agenda?.itens ?? []); setFusoHorario(agenda?.periodo.fusoHorario ?? 'America/Sao_Paulo'); setProfissionais(equipe)
            setMembros(membrosEquipe); setUsuariosDisponiveis(usuarios); setRecursos(recursosEquipe)
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setCarregando(false) }
    }, [data, httpGet, visualizacaoAgenda])

    useEffect(() => { carregar() }, [carregar])

    async function executarAcao(acao: () => Promise<unknown>) {
        try {
            setErro(null)
            await acao()
            await carregar()
            return true
        } catch (e) {
            setErro(mensagemDoErro(e))
            return false
        }
    }

    async function alterarStatus(id: number, status: string) {
        return executarAcao(() => httpPut(`/gestao/agendamentos/${id}/status`, { status }))
    }
    async function criarProfissional(dados: Omit<ProfissionalOperacional, 'id'>) {
        return executarAcao(() => httpPost('/profissionais', { ...dados, avaliacao: 5, quantidadeAvaliacoes: 0 }))
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
        dashboard, agendamentos, profissionais, membros, usuariosDisponiveis, recursos, permissoes, data, setData, fusoHorario, carregando, erro,
        recarregar: carregar, alterarStatus, criarProfissional, salvarMembro, criarPerfilParaMembro, removerMembro,
        buscarEscalas, salvarEscalas, criarRecurso, buscarIndisponibilidades, indisponibilizarRecurso, removerIndisponibilidade,
    }
}
