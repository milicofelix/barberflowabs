import type {
    AssinaturaEstabelecimento, ConciliacaoFinanceira, ConfiguracaoComissao, ContaFinanceira,
    CriarContaFinanceira, DadosFinanceiros, EventoAuditoriaFinanceira, FechamentoCaixa,
    FormaPagamento, PermissaoFinanceira, RepasseFinanceiro, ResumoFinanceiro, SalvarFormaPagamento,
    ServicoFinanceiro,
} from '../financeiro/tipos'
import type { PermissaoEquipe, ProfissionalOperacional } from '../operacao/tipos'
import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useRef, useState } from 'react'

const hoje = () => new Date().toISOString().slice(0, 10)
const inicioDoMes = () => `${hoje().slice(0, 7)}-01`
const VAZIO: DadosFinanceiros = {
    resumo: null, contas: [], comissoes: [], formasPagamento: [], caixas: [], repasses: [],
    conciliacoes: [], auditoria: [], assinatura: null, profissionais: [], servicos: [],
}

export default function useFinanceiro() {
    const { httpGet, httpPost, httpPut } = useAPI()
    const [inicio, setInicio] = useState(inicioDoMes())
    const [fim, setFim] = useState(hoje())
    const [dados, setDados] = useState<DadosFinanceiros>(VAZIO)
    const [permissoes, setPermissoes] = useState<PermissaoFinanceira[]>([])
    const [carregando, setCarregando] = useState(true)
    const [executando, setExecutando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)
    const emExecucao = useRef(false)

    const carregar = useCallback(async () => {
        try {
            setCarregando(true); setErro(null)
            const acessos = await httpGet<PermissaoEquipe[]>('/equipe/minhas-permissoes')
            const financeiros = acessos.filter((item): item is PermissaoFinanceira => item.startsWith('FINANCEIRO_'))
            setPermissoes(financeiros)
            if (!financeiros.includes('FINANCEIRO_VISUALIZAR')) { setDados(VAZIO); return }

            const periodo = `inicio=${inicio}&fim=${fim}`
            const [resumo, contas, comissoes, formasPagamento, caixas, repasses, conciliacoes, assinatura, profissionais, servicos, auditoria] = await Promise.all([
                httpGet<ResumoFinanceiro>(`/financeiro/resumo?${periodo}`),
                httpGet<ContaFinanceira[]>(`/financeiro/contas?${periodo}`),
                httpGet<ConfiguracaoComissao[]>('/financeiro/comissoes'),
                httpGet<FormaPagamento[]>('/financeiro/formas-pagamento'),
                httpGet<FechamentoCaixa[]>('/financeiro/caixas'),
                httpGet<RepasseFinanceiro[]>(`/financeiro/repasses?${periodo}`),
                httpGet<ConciliacaoFinanceira[]>('/financeiro/conciliacoes'),
                httpGet<AssinaturaEstabelecimento | null>('/financeiro/assinatura'),
                httpGet<ProfissionalOperacional[]>('/profissionais'),
                httpGet<ServicoFinanceiro[]>('/servicos'),
                financeiros.includes('FINANCEIRO_AUDITAR')
                    ? httpGet<EventoAuditoriaFinanceira[]>('/financeiro/auditoria')
                    : Promise.resolve([]),
            ])
            setDados({ resumo, contas, comissoes, formasPagamento, caixas, repasses, conciliacoes, assinatura, profissionais, servicos, auditoria })
        } catch (e) {
            setErro(mensagemDoErro(e))
        } finally {
            setCarregando(false)
        }
    }, [fim, httpGet, inicio])

    useEffect(() => { carregar() }, [carregar])

    const executar = useCallback(async (acao: () => Promise<unknown>, mensagem: string) => {
        if (emExecucao.current || !permissoes.includes('FINANCEIRO_GERENCIAR')) return false
        try {
            emExecucao.current = true; setExecutando(true); setErro(null); setSucesso(null)
            await acao(); await carregar(); setSucesso(mensagem)
            return true
        } catch (e) {
            setErro(mensagemDoErro(e)); return false
        } finally {
            emExecucao.current = false; setExecutando(false)
        }
    }, [carregar, permissoes])

    return {
        ...dados, inicio, fim, setInicio, setFim, permissoes, carregando, executando, erro, sucesso,
        podeVisualizar: permissoes.includes('FINANCEIRO_VISUALIZAR'),
        podeGerenciar: permissoes.includes('FINANCEIRO_GERENCIAR'),
        podeAuditar: permissoes.includes('FINANCEIRO_AUDITAR'), recarregar: carregar,
        criarConta: (payload: CriarContaFinanceira) => executar(() => httpPost('/financeiro/contas', payload), 'Conta criada.'),
        baixarConta: (id: number, payload: { valorPago: number; pagoEm: string; formaPagamentoId?: number }) => executar(() => httpPut(`/financeiro/contas/${id}/baixar`, payload), 'Baixa registrada.'),
        cancelarConta: (id: number) => executar(() => httpPut(`/financeiro/contas/${id}/cancelar`, {}), 'Conta cancelada.'),
        salvarComissao: (payload: { profissionalId?: number | null; servicoId?: number | null; percentual: number; ativo?: boolean }) => executar(() => httpPut('/financeiro/comissoes', payload), 'Comissão atualizada.'),
        salvarFormaPagamento: (payload: SalvarFormaPagamento, id?: number) => executar(() => id ? httpPut(`/financeiro/formas-pagamento/${id}`, payload) : httpPost('/financeiro/formas-pagamento', payload), 'Forma de pagamento atualizada.'),
        abrirCaixa: (payload: { saldoInicial?: number; observacoes?: string }) => executar(() => httpPost('/financeiro/caixas/abrir', payload), 'Caixa aberto.'),
        fecharCaixa: (id: number, payload: { saldoInformado: number; observacoes?: string }) => executar(() => httpPost(`/financeiro/caixas/${id}/fechar`, payload), 'Caixa fechado.'),
        calcularRepasses: () => executar(() => httpPost('/financeiro/repasses/calcular', { inicio, fim }), 'Repasses calculados.'),
        pagarRepasse: (id: number) => executar(() => httpPut(`/financeiro/repasses/${id}/pagar`, {}), 'Repasse pago.'),
        conciliar: (payload: { contaFinanceiraId?: number; provedor: string; transacaoExternaId: string; valorEsperado: number; valorRecebido: number; observacoes?: string }) => executar(() => httpPost('/financeiro/conciliacoes', payload), 'Conciliação registrada.'),
        gerarCobranca: () => executar(() => httpPost('/financeiro/assinatura/cobrancas', {}), 'Cobrança gerada.'),
    }
}
