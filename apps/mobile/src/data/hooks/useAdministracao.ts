import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useState } from 'react'

export interface EstabelecimentoAdmin {
    id: number; nome: string; slug: string; status: string; reviewStatus: string; tipoEstabelecimento?: string
    _count?: { usuarios: number; profissionais: number; servicos: number; agendamentos: number }
    assinatura?: { plano?: { nome: string }; status: string } | null
}

export default function useAdministracao() {
    const { httpGet, httpPut } = useAPI()
    const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoAdmin[]>([])
    const [pendentes, setPendentes] = useState<EstabelecimentoAdmin[]>([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const carregar = useCallback(async () => {
        try {
            setCarregando(true); setErro(null)
            const [todos, revisao] = await Promise.all([
                httpGet<EstabelecimentoAdmin[]>('/saas/admin/barbearias'),
                httpGet<EstabelecimentoAdmin[]>('/saas/admin/barbearias/pendentes'),
            ])
            setEstabelecimentos(todos); setPendentes(revisao)
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setCarregando(false) }
    }, [httpGet])
    useEffect(() => { carregar() }, [carregar])
    async function revisar(id: number, decisao: 'aprovar' | 'reprovar') {
        try {
            setErro(null)
            await httpPut(`/saas/admin/barbearias/${id}/${decisao}`, decisao === 'reprovar' ? { motivo: 'Revisão pelo aplicativo móvel' } : {})
            await carregar()
        } catch (e) { setErro(mensagemDoErro(e)) }
    }
    return { estabelecimentos, pendentes, carregando, erro, carregar, revisar }
}
