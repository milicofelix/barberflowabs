import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useState } from 'react'

export interface EstabelecimentoAdmin {
    id: number; nome: string; slug: string; status: string; reviewStatus: string; tipoEstabelecimento?: string
    _count?: { usuarios: number; profissionais: number; servicos: number; agendamentos: number }
    assinatura?: { plano?: { nome: string }; status: string } | null
}

export default function useAdministracao() {
    const { httpGet, httpPost, httpPut } = useAPI()
    const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoAdmin[]>([])
    const [pendentes, setPendentes] = useState<EstabelecimentoAdmin[]>([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)
    const [executando, setExecutando] = useState(false)
    const carregar = useCallback(async () => {
        try {
            setCarregando(true); setErro(null)
            const [todos, revisao] = await Promise.all([
                httpGet<EstabelecimentoAdmin[]>('/saas/admin/estabelecimentos'),
                httpGet<EstabelecimentoAdmin[]>('/saas/admin/estabelecimentos/pendentes'),
            ])
            setEstabelecimentos(todos); setPendentes(revisao)
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setCarregando(false) }
    }, [httpGet])
    useEffect(() => { carregar() }, [carregar])
    async function revisar(id: number, decisao: 'aprovar' | 'reprovar') {
        try {
            setErro(null)
            await httpPut(`/saas/admin/estabelecimentos/${id}/${decisao}`, decisao === 'reprovar' ? { motivo: 'Revisão pelo aplicativo móvel' } : {})
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
