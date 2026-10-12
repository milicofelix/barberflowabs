import type {
    AgendamentoOperacional, DashboardOperacional, EscalaProfissional, IndisponibilidadeRecurso, MembroEquipe,
    PermissaoEquipe, ProfissionalOperacional, RecursoOperacional, UsuarioEquipe,
} from '../operacao/tipos'
import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useState } from 'react'

const hoje = () => new Date().toISOString().slice(0, 10)

export default function useOperacao() {
    const { httpDelete, httpGet, httpPost, httpPut } = useAPI()
    const [dashboard, setDashboard] = useState<DashboardOperacional | null>(null)
    const [agendamentos, setAgendamentos] = useState<AgendamentoOperacional[]>([])
    const [profissionais, setProfissionais] = useState<ProfissionalOperacional[]>([])
    const [membros, setMembros] = useState<MembroEquipe[]>([])
    const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<UsuarioEquipe[]>([])
    const [recursos, setRecursos] = useState<RecursoOperacional[]>([])
    const [permissoes, setPermissoes] = useState<PermissaoEquipe[]>([])
    const [data, setData] = useState(hoje())
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const carregar = useCallback(async () => {
        try {
            setCarregando(true); setErro(null)
            const acessos = await httpGet<PermissaoEquipe[]>('/equipe/minhas-permissoes')
            setPermissoes(acessos)
            const pode = (permissao: PermissaoEquipe) => acessos.includes(permissao)
            const [resumo, agenda, equipe, membrosEquipe, usuarios, recursosEquipe] = await Promise.all([
                pode('AGENDA_GERENCIAR') ? httpGet<DashboardOperacional>('/gestao/dashboard') : Promise.resolve(null),
                pode('AGENDA_GERENCIAR') ? httpGet<AgendamentoOperacional[]>(`/gestao/agendamentos?data=${data}`) : Promise.resolve([]),
                httpGet<ProfissionalOperacional[]>('/profissionais'),
                pode('EQUIPE_GERENCIAR') ? httpGet<MembroEquipe[]>('/equipe') : Promise.resolve([]),
                pode('EQUIPE_GERENCIAR') ? httpGet<UsuarioEquipe[]>('/equipe/usuarios-disponiveis') : Promise.resolve([]),
                pode('RECURSOS_GERENCIAR') ? httpGet<RecursoOperacional[]>('/recursos') : Promise.resolve([]),
            ])
            setDashboard(resumo); setAgendamentos(agenda); setProfissionais(equipe)
            setMembros(membrosEquipe); setUsuariosDisponiveis(usuarios); setRecursos(recursosEquipe)
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setCarregando(false) }
    }, [data, httpGet])

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
    const removerMembro = (id: number) => executarAcao(() => httpDelete(`/equipe/${id}`))
    const buscarEscalas = (profissionalId: number) => httpGet<EscalaProfissional[]>(`/equipe/profissionais/${profissionalId}/escalas`)
    const salvarEscalas = (profissionalId: number, escalas: EscalaProfissional[]) => executarAcao(() => httpPut(`/equipe/profissionais/${profissionalId}/escalas`, { escalas }))
    const criarRecurso = (dados: Omit<RecursoOperacional, 'id'>) => executarAcao(() => httpPost('/recursos', dados))
    const indisponibilizarRecurso = (id: number, dados: { inicio: string; fim: string; motivo?: string }) => executarAcao(() => httpPost(`/recursos/${id}/indisponibilidades`, dados))
    const buscarIndisponibilidades = (id: number) => httpGet<IndisponibilidadeRecurso[]>(`/recursos/${id}/indisponibilidades`)
    const removerIndisponibilidade = (recursoId: number, id: number) => executarAcao(() => httpDelete(`/recursos/${recursoId}/indisponibilidades/${id}`))

    return {
        dashboard, agendamentos, profissionais, membros, usuariosDisponiveis, recursos, permissoes, data, setData, carregando, erro,
        recarregar: carregar, alterarStatus, criarProfissional, salvarMembro, removerMembro,
        buscarEscalas, salvarEscalas, criarRecurso, buscarIndisponibilidades, indisponibilizarRecurso, removerIndisponibilidade,
    }
}
