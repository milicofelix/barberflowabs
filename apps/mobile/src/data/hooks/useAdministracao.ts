import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'

const INTERVALO_ATUALIZACAO_MS = 15_000

export interface EstabelecimentoAdmin {
    id: number; nome: string; slug: string; status: string; reviewStatus: string; tipoEstabelecimento?: string
    _count?: { usuarios: number; profissionais: number; servicos: number; agendamentos: number }
    assinatura?: { plano?: { nome: string }; status: string } | null
}
export interface SolicitacaoAdmin {
    id: number; nomePublico: string; tipoEstabelecimento: string; modeloAtendimento: string
    cidade?: string; estado?: string; usuario: { nome: string; email: string }
}

export default function useAdministracao() {
    const { httpGet, httpPost, httpPut } = useAPI()
    const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoAdmin[]>([])
    const [pendentes, setPendentes] = useState<SolicitacaoAdmin[]>([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)
    const [executando, setExecutando] = useState(false)
    const carregar = useCallback(async () => {
        try {
            setCarregando(true); setErro(null)
            const [todos, revisao] = await Promise.all([
                httpGet<EstabelecimentoAdmin[]>('/saas/admin/estabelecimentos'),
                httpGet<SolicitacaoAdmin[]>('/admin/solicitacoes-estabelecimento', { escopoTenant: 'nenhum' }),
            ])
            setEstabelecimentos(todos); setPendentes(revisao)
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setCarregando(false) }
    }, [httpGet])
    useEffect(() => {
        carregar()
        const intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS)
        const assinatura = AppState.addEventListener('change', (estado) => { if (estado === 'active') carregar() })
        return () => { clearInterval(intervalo); assinatura.remove() }
    }, [carregar])
    async function revisar(id: number, decisao: 'aprovar' | 'solicitar-correcao' | 'reprovar') {
        try {
            setErro(null)
            const motivo = decisao === 'aprovar' ? undefined : decisao === 'reprovar' ? 'Cadastro não aprovado pela administração.' : 'Revise os dados cadastrais indicados pela administração.'
            await httpPut(`/admin/solicitacoes-estabelecimento/${id}/${decisao}`, { motivo }, { escopoTenant: 'nenhum' })
            await carregar()
        } catch (e) { setErro(mensagemDoErro(e)) }
    }
    async function processarInadimplencia() {
        if (executando) return
        try {
            setExecutando(true); setErro(null); setSucesso(null)
            const resposta = await httpPost<{ processadas: number }>('/saas/admin/inadimplencia/processar', {})
            setSucesso(`${resposta.processadas} cobrança(s) vencida(s) processada(s).`)
            await carregar()
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setExecutando(false) }
    }
    return { estabelecimentos, pendentes, carregando, executando, erro, sucesso, carregar, revisar, processarInadimplencia }
}
