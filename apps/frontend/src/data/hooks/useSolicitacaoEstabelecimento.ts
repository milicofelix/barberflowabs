'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DadosOnboarding, SolicitacaoEstabelecimento } from '@/components/saas/solicitacao-estabelecimento.types'
import { somenteDigitos } from '@/components/saas/solicitacao-estabelecimento.types'
import { sugerirSegmentos } from '@/components/saas/onboarding.config'
import useAPI from './useAPI'

export type FormularioSolicitacao = {
    nomePublico: string; emailComercial: string; telefoneComercial: string
    tipoEstabelecimento: string; modeloAtendimento: string; planoSlug: string
    cep: string; logradouro: string; numero: string; complemento: string
    pontoReferencia: string; bairro: string; cidade: string; estado: string
    segmentoIds: number[]; especialidadeIds: number[]
}

const formularioVazio: FormularioSolicitacao = {
    nomePublico: '', emailComercial: '', telefoneComercial: '', tipoEstabelecimento: '',
    modeloAtendimento: 'PRESENCIAL', planoSlug: 'mensal', cep: '', logradouro: '', numero: '',
    complemento: '', pontoReferencia: '', bairro: '', cidade: '', estado: '',
    segmentoIds: [], especialidadeIds: [],
}

export default function useSolicitacaoEstabelecimento() {
    const { httpGet, httpPost, httpPut } = useAPI()
    const [dados, setDados] = useState<DadosOnboarding | null>(null)
    const [form, setForm] = useState<FormularioSolicitacao>(formularioVazio)
    const [passo, setPasso] = useState(0)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState('')

    const carregar = useCallback(async () => {
        setCarregando(true); setMensagem('')
        const [solicitacao, configuracao, segmentos, planos] = await Promise.all([
            httpPost('/solicitacoes-estabelecimento', {}),
            httpGet('/solicitacoes-estabelecimento/configuracao'),
            httpGet('/catalogo/segmentos'),
            httpGet('/saas/planos'),
        ])
        const erro = [solicitacao, configuracao, segmentos, planos].find((item) => item?.statusCode)
        if (erro) { setMensagem(erro.message ?? 'Não foi possível iniciar o cadastro.'); setCarregando(false); return }
        const pacote = { solicitacao, configuracao, segmentos, planos } as DadosOnboarding
        const formulario = mapearFormulario(solicitacao)
        setDados(pacote); setForm(formulario); setPasso(determinarPassoRetomada(formulario)); setCarregando(false)
    }, [httpGet, httpPost])

    useEffect(() => { carregar() }, [carregar])

    const especialidadesDisponiveis = useMemo(() => dados?.segmentos
        .filter((segmento) => form.segmentoIds.includes(segmento.id))
        .flatMap((segmento) => segmento.especialidades) ?? [], [dados?.segmentos, form.segmentoIds])

    function alterar<K extends keyof FormularioSolicitacao>(campo: K, valor: FormularioSolicitacao[K]) {
        setForm((atual) => ({ ...atual, [campo]: valor })); setMensagem('')
    }

    function selecionarTipo(tipo: string) {
        if (!dados) return
        const sugeridos = sugerirSegmentos(tipo, dados.segmentos)
        const segmentoIds = sugeridos.length ? sugeridos : form.segmentoIds
        const permitidas = dados.segmentos.filter((item) => segmentoIds.includes(item.id)).flatMap((item) => item.especialidades.map((especialidade) => especialidade.id))
        setForm((atual) => ({
            ...atual, tipoEstabelecimento: tipo, segmentoIds,
            especialidadeIds: atual.especialidadeIds.filter((id) => permitidas.includes(id)),
        })); setMensagem('')
    }

    function alternarSegmento(id: number) {
        setForm((atual) => {
            const segmentoIds = atual.segmentoIds.includes(id) ? atual.segmentoIds.filter((item) => item !== id) : [...atual.segmentoIds, id]
            const permitidas = dados?.segmentos.filter((item) => segmentoIds.includes(item.id)).flatMap((item) => item.especialidades.map((especialidade) => especialidade.id)) ?? []
            return { ...atual, segmentoIds, especialidadeIds: atual.especialidadeIds.filter((item) => permitidas.includes(item)) }
        })
    }

    function alternarEspecialidade(id: number) {
        setForm((atual) => ({ ...atual, especialidadeIds: atual.especialidadeIds.includes(id)
            ? atual.especialidadeIds.filter((item) => item !== id) : [...atual.especialidadeIds, id] }))
    }

    async function avancar() {
        const erro = validarPasso(passo, form)
        if (erro) return setMensagem(erro)
        if (passo === 0) return setPasso(1)
        if (passo < 4) {
            const salvo = await salvar()
            if (salvo) setPasso((atual) => atual + 1)
        }
    }

    async function salvar() {
        if (!dados) return false
        setSalvando(true); setMensagem('')
        const resposta = await httpPut(`/solicitacoes-estabelecimento/${dados.solicitacao.id}`, {
            ...form,
            versao: dados.solicitacao.versao,
            telefoneComercial: somenteDigitos(form.telefoneComercial),
            cep: somenteDigitos(form.cep),
            estado: form.estado.toUpperCase(),
        })
        setSalvando(false)
        if (resposta?.statusCode) { setMensagem(resposta.message ?? 'Não foi possível salvar.'); return false }
        atualizarSolicitacao(resposta); setMensagem('Rascunho salvo.'); return true
    }

    async function enviar(aceitouTermos: boolean) {
        if (!dados) return
        const erro = validarPasso(4, form)
        if (erro) return setMensagem(erro)
        if (!aceitouTermos) return setMensagem('Confirme os termos e a veracidade das informações.')
        const salvo = await salvar()
        if (!salvo) return
        setSalvando(true)
        const versaoAtual = dados.solicitacao.versao + 1
        const resposta = await httpPost(`/solicitacoes-estabelecimento/${dados.solicitacao.id}/enviar`, {
            versao: versaoAtual, aceitouTermos: true, termosVersao: dados.configuracao.termosVersao,
        })
        setSalvando(false)
        if (resposta?.statusCode) { setMensagem(resposta.message ?? 'Não foi possível enviar.'); return }
        atualizarSolicitacao(resposta); setMensagem('Cadastro enviado para análise.')
    }

    function atualizarSolicitacao(solicitacao: SolicitacaoEstabelecimento) {
        setDados((atual) => atual ? { ...atual, solicitacao } : atual)
    }

    return {
        dados, form, passo, carregando, salvando, mensagem, especialidadesDisponiveis,
        alterar, selecionarTipo, alternarSegmento, alternarEspecialidade, avancar, salvar, enviar,
        voltar: () => { setPasso((atual) => Math.max(0, atual - 1)); setMensagem('') },
        irParaPasso: setPasso,
    }
}

function mapearFormulario(solicitacao: SolicitacaoEstabelecimento): FormularioSolicitacao {
    return {
        ...formularioVazio,
        nomePublico: solicitacao.nomePublico ?? '', emailComercial: solicitacao.emailComercial ?? '',
        telefoneComercial: solicitacao.telefoneComercial ?? '', tipoEstabelecimento: solicitacao.tipoEstabelecimento ?? '',
        modeloAtendimento: solicitacao.modeloAtendimento ?? 'PRESENCIAL', planoSlug: solicitacao.planoSlug ?? 'mensal',
        cep: solicitacao.cep ?? '', logradouro: solicitacao.logradouro ?? '', numero: solicitacao.numero ?? '',
        complemento: solicitacao.complemento ?? '', pontoReferencia: solicitacao.pontoReferencia ?? '',
        bairro: solicitacao.bairro ?? '', cidade: solicitacao.cidade ?? '', estado: solicitacao.estado ?? '',
        segmentoIds: solicitacao.segmentos.map((item) => item.segmentoId),
        especialidadeIds: solicitacao.especialidades.map((item) => item.especialidadeId),
    }
}

function validarPasso(passo: number, form: FormularioSolicitacao): string {
    if (passo === 1 && (!form.tipoEstabelecimento || !form.segmentoIds.length || !form.especialidadeIds.length)) return 'Selecione o tipo, ao menos um segmento e uma especialidade.'
    if (passo === 2 && (!form.nomePublico.trim() || !/^\S+@\S+\.\S+$/.test(form.emailComercial) || !/^\d{10,11}$/.test(somenteDigitos(form.telefoneComercial)) || !form.planoSlug)) return 'Preencha corretamente os dados comerciais e o plano.'
    const exigeEndereco = form.modeloAtendimento !== 'DOMICILIAR'
    if (passo === 3 && exigeEndereco && (somenteDigitos(form.cep).length !== 8 || !form.logradouro.trim() || !form.numero.trim() || !form.bairro.trim() || !form.cidade.trim() || form.estado.trim().length !== 2)) return 'Preencha o endereço completo para o atendimento presencial.'
    if (passo === 4) return validarPasso(1, form) || validarPasso(2, form) || validarPasso(3, form)
    return ''
}

function determinarPassoRetomada(form: FormularioSolicitacao) {
    if (!form.tipoEstabelecimento || !form.segmentoIds.length || !form.especialidadeIds.length) return 0
    if (!form.nomePublico || !form.emailComercial || !form.telefoneComercial) return 2
    if (form.modeloAtendimento !== 'DOMICILIAR' && (!form.cep || !form.logradouro || !form.numero || !form.cidade || !form.estado)) return 3
    return 4
}
