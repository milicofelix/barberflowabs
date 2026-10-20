import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useState } from 'react'
import { AppState } from 'react-native'

const INTERVALO_ATUALIZACAO_MS = 15_000

export interface EstabelecimentoAdmin {
    id: number; nome: string; slug: string; status: string; reviewStatus: string; tipoEstabelecimento?: string
    reviewReason?: string | null
    latitude?: number | null; longitude?: number | null
    endereco?: string; cep?: string; logradouro?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; estado?: string
    _count?: { usuarios: number; profissionais: number; servicos: number; agendamentos: number }
    assinatura?: { plano?: { nome: string }; status: string } | null
}
export interface SolicitacaoAdmin {
    id: number; nomePublico: string; tipoEstabelecimento: string; modeloAtendimento: string
    cep?: string; logradouro?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; estado?: string; usuario: { nome: string; email: string }
}
export interface CoordenadasResolvidas { latitude: number; longitude: number; origem: string; mapsUrl: string }

export default function useAdministracao() {
    const { httpGet, httpPost, httpPut } = useAPI()
    const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoAdmin[]>([])
    const [pendentes, setPendentes] = useState<SolicitacaoAdmin[]>([])
    const [revisoesPerfil, setRevisoesPerfil] = useState<EstabelecimentoAdmin[]>([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)
    const [executando, setExecutando] = useState(false)
    const carregar = useCallback(async () => {
        try {
            setCarregando(true); setErro(null)
            const [todos, revisao, perfis] = await Promise.all([
                httpGet<EstabelecimentoAdmin[]>('/saas/admin/estabelecimentos'),
                httpGet<SolicitacaoAdmin[]>('/admin/solicitacoes-estabelecimento', { escopoTenant: 'nenhum' }),
                httpGet<EstabelecimentoAdmin[]>('/saas/admin/estabelecimentos/pendentes'),
            ])
            setEstabelecimentos(todos); setPendentes(revisao); setRevisoesPerfil(perfis)
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setCarregando(false) }
    }, [httpGet])
    useEffect(() => {
        carregar()
        const intervalo = setInterval(carregar, INTERVALO_ATUALIZACAO_MS)
        const assinatura = AppState.addEventListener('change', (estado) => { if (estado === 'active') carregar() })
        return () => { clearInterval(intervalo); assinatura.remove() }
    }, [carregar])
    async function revisar(id: number, decisao: 'aprovar' | 'solicitar-correcao' | 'reprovar', coordenadas?: { latitude: number; longitude: number }) {
        try {
            setErro(null)
            const motivo = decisao === 'aprovar' ? undefined : decisao === 'reprovar' ? 'Cadastro não aprovado pela administração.' : 'Revise os dados cadastrais indicados pela administração.'
            await httpPut(`/admin/solicitacoes-estabelecimento/${id}/${decisao}`, { motivo, ...coordenadas }, { escopoTenant: 'nenhum' })
            await carregar()
        } catch (e) { setErro(mensagemDoErro(e)) }
    }
    async function revisarPerfil(id: number, decisao: 'aprovar' | 'reprovar') {
        try {
            setErro(null); setSucesso(null)
            await httpPut(`/saas/admin/estabelecimentos/${id}/${decisao}`, {
                motivo: decisao === 'aprovar'
                    ? 'Alterações cadastrais aprovadas pelo superadmin.'
                    : 'Alterações cadastrais não aprovadas. Revise o perfil público.',
            })
            setSucesso(decisao === 'aprovar' ? 'Perfil do estabelecimento aprovado.' : 'Perfil do estabelecimento reprovado.')
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
    async function resolverCoordenadasSolicitacao(id: number, googleMapsUrl?: string) {
        try {
            setErro(null); setSucesso(null)
            const resposta = await httpPost<CoordenadasResolvidas>(`/admin/solicitacoes-estabelecimento/${id}/resolver-coordenadas`, { googleMapsUrl }, { escopoTenant: 'nenhum' })
            setSucesso('Localização encontrada. Confira o ponto antes de aprovar.')
            return resposta
        } catch (e) { setErro(mensagemDoErro(e)); throw e }
    }
    async function resolverCoordenadasEstabelecimento(id: number, googleMapsUrl?: string) {
        try {
            setErro(null); setSucesso(null)
            const resposta = await httpPost<CoordenadasResolvidas>(`/saas/admin/estabelecimentos/${id}/resolver-coordenadas`, { googleMapsUrl }, { escopoTenant: 'nenhum' })
            setSucesso('Coordenadas localizadas e salvas automaticamente.')
            await carregar(); return resposta
        } catch (e) { setErro(mensagemDoErro(e)); throw e }
    }
    return { estabelecimentos, pendentes, revisoesPerfil, carregando, executando, erro, sucesso, carregar, revisar, revisarPerfil, resolverCoordenadasSolicitacao, resolverCoordenadasEstabelecimento, processarInadimplencia }
}
