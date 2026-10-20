'use client'

import useAPI from './useAPI'
import { useCallback, useEffect, useRef, useState } from 'react'

const hoje = () => new Date().toISOString().slice(0, 10)
const inicioMes = () => `${hoje().slice(0, 7)}-01`

export default function useFinanceiro() {
    const { httpGet, httpPost, httpPut } = useAPI()
    const [inicio, setInicio] = useState(inicioMes())
    const [fim, setFim] = useState(hoje())
    const [dados, setDados] = useState<any>({ contas: [], comissoes: [], formas: [], caixas: [], repasses: [], conciliacoes: [], auditoria: [], profissionais: [], servicos: [] })
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(true)
    const executando = useRef(false)

    const carregar = useCallback(async () => {
        setCarregando(true)
        const periodo = `inicio=${inicio}&fim=${fim}`
        const respostas = await Promise.all([
            httpGet(`/financeiro/resumo?${periodo}`), httpGet(`/financeiro/contas?${periodo}`),
            httpGet('/financeiro/comissoes'), httpGet('/financeiro/formas-pagamento'),
            httpGet('/financeiro/caixas'), httpGet(`/financeiro/repasses?${periodo}`),
            httpGet('/financeiro/conciliacoes'), httpGet('/financeiro/auditoria'),
            httpGet('/financeiro/assinatura'), httpGet('/profissionais'), httpGet('/servicos'),
        ])
        setDados({
            resumo: normalizar(respostas[0], null), contas: normalizar(respostas[1], []),
            comissoes: normalizar(respostas[2], []), formas: normalizar(respostas[3], []),
            caixas: normalizar(respostas[4], []), repasses: normalizar(respostas[5], []),
            conciliacoes: normalizar(respostas[6], []), auditoria: normalizar(respostas[7], []),
            assinatura: normalizar(respostas[8], null), profissionais: normalizar(respostas[9], []),
            servicos: normalizar(respostas[10], []),
        })
        setCarregando(false)
    }, [fim, httpGet, inicio])

    useEffect(() => { carregar() }, [carregar])

    async function executar(acao: () => Promise<any>, sucesso: string) {
        if (executando.current) return false
        executando.current = true
        setMensagem('')
        try {
            const resposta = await acao()
            if (resposta?.statusCode !== undefined) { setMensagem(resposta.message ?? 'Não foi possível concluir.'); return false }
            await carregar(); setMensagem(sucesso); return true
        } finally {
            executando.current = false
        }
    }

    return {
        ...dados, inicio, fim, setInicio, setFim, mensagem, carregando, recarregar: carregar,
        criarConta: (payload: any) => executar(() => httpPost('/financeiro/contas', payload), 'Conta criada.'),
        baixarConta: (id: number, payload: any) => executar(() => httpPut(`/financeiro/contas/${id}/baixar`, payload), 'Baixa registrada.'),
        cancelarConta: (id: number) => executar(() => httpPut(`/financeiro/contas/${id}/cancelar`, {}), 'Conta cancelada.'),
        salvarComissao: (payload: any) => executar(() => httpPut('/financeiro/comissoes', payload), 'Comissão atualizada.'),
        salvarForma: (payload: any, id?: number) => executar(() => id ? httpPut(`/financeiro/formas-pagamento/${id}`, payload) : httpPost('/financeiro/formas-pagamento', payload), 'Forma de pagamento atualizada.'),
        abrirCaixa: (payload: any) => executar(() => httpPost('/financeiro/caixas/abrir', payload), 'Caixa aberto.'),
        fecharCaixa: (id: number, payload: any) => executar(() => httpPost(`/financeiro/caixas/${id}/fechar`, payload), 'Caixa fechado.'),
        calcularRepasses: () => executar(() => httpPost('/financeiro/repasses/calcular', { inicio, fim }), 'Repasses calculados.'),
        pagarRepasse: (id: number) => executar(() => httpPut(`/financeiro/repasses/${id}/pagar`, {}), 'Repasse pago.'),
        conciliar: (payload: any) => executar(() => httpPost('/financeiro/conciliacoes', payload), 'Conciliação registrada.'),
        gerarCobranca: () => executar(() => httpPost('/financeiro/assinatura/cobrancas', {}), 'Cobrança gerada.'),
    }
}

function normalizar(valor: any, fallback: any) {
    return valor?.statusCode !== undefined ? fallback : valor
}
