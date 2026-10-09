import type {
    AgendamentoOperacional, DashboardOperacional, LancamentoFinanceiro, ProfissionalOperacional,
} from '../operacao/tipos'
import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useState } from 'react'

const hoje = () => new Date().toISOString().slice(0, 10)

export default function useOperacao() {
    const { httpGet, httpPost, httpPut } = useAPI()
    const [dashboard, setDashboard] = useState<DashboardOperacional | null>(null)
    const [agendamentos, setAgendamentos] = useState<AgendamentoOperacional[]>([])
    const [profissionais, setProfissionais] = useState<ProfissionalOperacional[]>([])
    const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([])
    const [data, setData] = useState(hoje())
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const carregar = useCallback(async () => {
        try {
            setCarregando(true); setErro(null)
            const [resumo, agenda, equipe, financeiro] = await Promise.all([
                httpGet<DashboardOperacional>('/gestao/dashboard'),
                httpGet<AgendamentoOperacional[]>(`/gestao/agendamentos?data=${data}`),
                httpGet<ProfissionalOperacional[]>('/profissionais'),
                httpGet<LancamentoFinanceiro[]>(`/gestao/financeiro?inicio=${data}&fim=${data}`),
            ])
            setDashboard(resumo); setAgendamentos(agenda); setProfissionais(equipe); setLancamentos(financeiro)
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
        await executarAcao(() => httpPut(`/gestao/agendamentos/${id}/status`, { status }))
    }
    async function criarProfissional(dados: Omit<ProfissionalOperacional, 'id'>) {
        await executarAcao(() => httpPost('/profissionais', { ...dados, avaliacao: 5, quantidadeAvaliacoes: 0 }))
    }
    async function criarLancamento(dados: Omit<LancamentoFinanceiro, 'id'>) {
        await executarAcao(() => httpPost('/gestao/financeiro', dados))
    }

    return {
        dashboard, agendamentos, profissionais, lancamentos, data, setData, carregando, erro,
        recarregar: carregar, alterarStatus, criarProfissional, criarLancamento,
    }
}
