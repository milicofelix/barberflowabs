import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    FORMULARIO_VAZIO, FormularioSolicitacao, mapearFormulario, PlanoOnboarding, SegmentoOnboarding,
    SolicitacaoEstabelecimento, somenteDigitos, sugerirSegmentos,
} from '../onboarding/solicitacao-estabelecimento'
import useAPI, { mensagemDoErro } from './useAPI'
import useLocalStorage from './useLocalStorage'
import useSessao from './useSessao'

interface Configuracao { termosVersao: string; tiposEstabelecimento: string[]; modelosAtendimento: string[] }
interface RascunhoLocal { solicitacaoId: number; versao: number; passo: number; form: FormularioSolicitacao }
const STATUS_EDITAVEIS = ['RASCUNHO', 'REJECTED', 'CORRECTION_REQUESTED']

export default function useOnboardingEstabelecimento() {
    const { usuario } = useSessao()
    const { httpGet, httpPost, httpPut } = useAPI()
    const { get, set, remove } = useLocalStorage()
    const [form, setForm] = useState<FormularioSolicitacao>(FORMULARIO_VAZIO)
    const [solicitacao, setSolicitacao] = useState<SolicitacaoEstabelecimento | null>(null)
    const [configuracao, setConfiguracao] = useState<Configuracao | null>(null)
    const [segmentos, setSegmentos] = useState<SegmentoOnboarding[]>([])
    const [planos, setPlanos] = useState<PlanoOnboarding[]>([])
    const [passo, setPasso] = useState(0)
    const [carregando, setCarregando] = useState(true)
    const [processando, setProcessando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [mensagem, setMensagem] = useState<string | null>(null)
    const [hidratado, setHidratado] = useState(false)
    const chaveRascunho = `@uniflowabs/solicitacao-estabelecimento:${usuario?.id ?? 'anonimo'}`

    const carregar = useCallback(async () => {
        if (!usuario) return
        try {
            setCarregando(true); setErro(null)
            const [registro, opcoes, catalogo, planosDisponiveis] = await Promise.all([
                httpPost<SolicitacaoEstabelecimento>('/solicitacoes-estabelecimento', {}, { escopoTenant: 'nenhum' }),
                httpGet<Configuracao>('/solicitacoes-estabelecimento/configuracao', { escopoTenant: 'nenhum' }),
                httpGet<SegmentoOnboarding[]>('/catalogo/segmentos', { escopoTenant: 'nenhum' }),
                httpGet<PlanoOnboarding[]>('/saas/planos', { escopoTenant: 'nenhum' }),
            ])
            const formularioServidor = mapearFormulario(registro)
            const local = await get(chaveRascunho).catch(() => null) as RascunhoLocal | null
            const localValido = local?.solicitacaoId === registro.id && local.versao === registro.versao && STATUS_EDITAVEIS.includes(registro.status)
            setSolicitacao(registro); setConfiguracao(opcoes); setSegmentos(catalogo); setPlanos(planosDisponiveis)
            setForm(localValido ? local.form : formularioServidor)
            setPasso(localValido ? local.passo : determinarPassoRetomada(formularioServidor))
            if (!STATUS_EDITAVEIS.includes(registro.status)) await remove(chaveRascunho).catch(() => undefined)
            setHidratado(true)
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setCarregando(false) }
    }, [chaveRascunho, get, httpGet, httpPost, remove, usuario])

    useEffect(() => { carregar() }, [carregar])
    useEffect(() => {
        if (!hidratado || !solicitacao || !STATUS_EDITAVEIS.includes(solicitacao.status)) return
        const timeout = setTimeout(() => set(chaveRascunho, { solicitacaoId: solicitacao.id, versao: solicitacao.versao, passo, form }).catch(() => undefined), 250)
        return () => clearTimeout(timeout)
    }, [chaveRascunho, form, hidratado, passo, set, solicitacao])

    const especialidades = useMemo(() => segmentos.filter((item) => form.segmentoIds.includes(item.id)).flatMap((item) => item.especialidades), [form.segmentoIds, segmentos])

    function alterar<K extends keyof FormularioSolicitacao>(campo: K, valor: FormularioSolicitacao[K]) {
        setForm((atual) => ({ ...atual, [campo]: valor })); limparFeedback()
    }
    function selecionarTipo(tipo: string) {
        const sugeridos = sugerirSegmentos(tipo, segmentos)
        setForm((atual) => {
            const segmentoIds = sugeridos.length ? sugeridos : atual.segmentoIds
            const permitidas = idsEspecialidades(segmentos, segmentoIds)
            return { ...atual, tipoEstabelecimento: tipo, segmentoIds, especialidadeIds: atual.especialidadeIds.filter((id) => permitidas.has(id)) }
        }); limparFeedback()
    }
    function alternarSegmento(id: number) {
        setForm((atual) => {
            const segmentoIds = atual.segmentoIds.includes(id) ? atual.segmentoIds.filter((item) => item !== id) : [...atual.segmentoIds, id]
            const permitidas = idsEspecialidades(segmentos, segmentoIds)
            return { ...atual, segmentoIds, especialidadeIds: atual.especialidadeIds.filter((item) => permitidas.has(item)) }
        }); limparFeedback()
    }
    function alternarEspecialidade(id: number) {
        setForm((atual) => ({ ...atual, especialidadeIds: atual.especialidadeIds.includes(id)
            ? atual.especialidadeIds.filter((item) => item !== id) : [...atual.especialidadeIds, id] })); limparFeedback()
    }
    async function avancar() {
        const problema = validarPasso(passo, form)
        if (problema) return setErro(problema)
        if (passo === 0) return setPasso(1)
        if (passo < 4 && await salvar()) setPasso((atual) => atual + 1)
    }
    async function salvar() {
        if (!solicitacao || processando) return null
        try {
            setProcessando(true); limparFeedback()
            const atualizado = await httpPut<SolicitacaoEstabelecimento>(`/solicitacoes-estabelecimento/${solicitacao.id}`, {
                ...form, versao: solicitacao.versao, telefoneComercial: somenteDigitos(form.telefoneComercial),
                cep: somenteDigitos(form.cep), estado: form.estado.toUpperCase(),
            }, { escopoTenant: 'nenhum' })
            setSolicitacao(atualizado); setMensagem('Rascunho salvo.'); return atualizado
        } catch (e) { setErro(mensagemDoErro(e)); return null } finally { setProcessando(false) }
    }
    async function enviar(aceitouTermos: boolean) {
        if (!solicitacao || !configuracao || processando) return
        const problema = validarPasso(4, form)
        if (problema) return setErro(problema)
        if (!aceitouTermos) return setErro('Confirme os termos e a veracidade das informações.')
        const atualizado = await salvar()
        if (!atualizado) return
        try {
            setProcessando(true); limparFeedback()
            const enviado = await httpPost<SolicitacaoEstabelecimento>(`/solicitacoes-estabelecimento/${atualizado.id}/enviar`, {
                versao: atualizado.versao, aceitouTermos: true, termosVersao: configuracao.termosVersao,
            }, { escopoTenant: 'nenhum' })
            setSolicitacao(enviado); await remove(chaveRascunho).catch(() => undefined); setMensagem('Cadastro enviado para análise.')
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setProcessando(false) }
    }
    function limparFeedback() { setErro(null); setMensagem(null) }

    return {
        form, solicitacao, configuracao, segmentos, especialidades, planos, passo, carregando, processando, erro, mensagem,
        alterar, selecionarTipo, alternarSegmento, alternarEspecialidade, avancar, salvar, enviar,
        voltar: () => { setPasso((atual) => Math.max(0, atual - 1)); limparFeedback() },
    }
}

function idsEspecialidades(segmentos: SegmentoOnboarding[], ids: number[]) {
    return new Set(segmentos.filter((item) => ids.includes(item.id)).flatMap((item) => item.especialidades.map((especialidade) => especialidade.id)))
}
function validarPasso(passo: number, form: FormularioSolicitacao): string | null {
    if (passo === 1 && (!form.tipoEstabelecimento || !form.segmentoIds.length || !form.especialidadeIds.length)) return 'Selecione o tipo, ao menos um segmento e uma especialidade.'
    if (passo === 2 && (!form.nomePublico.trim() || !/^\S+@\S+\.\S+$/.test(form.emailComercial) || !/^\d{10,11}$/.test(somenteDigitos(form.telefoneComercial)) || !form.planoSlug)) return 'Preencha corretamente os dados comerciais e o plano.'
    if (passo === 3 && form.modeloAtendimento !== 'DOMICILIAR' && (somenteDigitos(form.cep).length !== 8 || !form.logradouro.trim() || !form.numero.trim() || !form.bairro.trim() || !form.cidade.trim() || form.estado.length !== 2)) return 'Preencha o endereço completo para o atendimento presencial.'
    if (passo === 4) return validarPasso(1, form) || validarPasso(2, form) || validarPasso(3, form)
    return null
}
function determinarPassoRetomada(form: FormularioSolicitacao) {
    if (!form.tipoEstabelecimento || !form.segmentoIds.length || !form.especialidadeIds.length) return 0
    if (!form.nomePublico || !form.emailComercial || !form.telefoneComercial) return 2
    if (form.modeloAtendimento !== 'DOMICILIAR' && (!form.cep || !form.logradouro || !form.numero || !form.cidade || !form.estado)) return 3
    return 4
}
