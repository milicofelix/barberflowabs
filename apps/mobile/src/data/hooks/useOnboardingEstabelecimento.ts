import useAPI, { mensagemDoErro } from './useAPI'
import { useEffect, useMemo, useState } from 'react'

interface Segmento { id: number; nome: string; especialidades: Array<{ id: number; nome: string }> }
interface Plano { slug: string; nome: string; valorDoCiclo?: number; precoMensal?: number }

const inicial = {
    nome: '', slug: '', emailEstabelecimento: '', telefoneEstabelecimento: '', tipoEstabelecimento: 'BARBEARIA',
    modeloAtendimento: 'PRESENCIAL', segmentoIds: [] as number[], especialidadeIds: [] as number[],
    nomeResponsavel: '', emailResponsavel: '', telefoneResponsavel: '', senha: '', planoSlug: 'mensal',
}

export default function useOnboardingEstabelecimento() {
    const { httpGet, httpPost } = useAPI()
    const [form, setForm] = useState(inicial)
    const [segmentos, setSegmentos] = useState<Segmento[]>([])
    const [planos, setPlanos] = useState<Plano[]>([])
    const [processando, setProcessando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [concluido, setConcluido] = useState(false)
    useEffect(() => {
        Promise.all([
            httpGet<Segmento[]>('/catalogo/segmentos', { escopoTenant: 'nenhum' }),
            httpGet<Plano[]>('/saas/planos', { escopoTenant: 'nenhum' }),
        ])
            .then(([catalogo, opcoes]) => { setSegmentos(catalogo); setPlanos(opcoes) }).catch((e) => setErro(mensagemDoErro(e)))
    }, [httpGet])
    const especialidades = useMemo(() => segmentos.filter((s) => form.segmentoIds.includes(s.id)).flatMap((s) => s.especialidades), [form.segmentoIds, segmentos])
    function alterar(campo: string, valor: any) {
        setForm((atual) => ({ ...atual, [campo]: valor, ...(campo === 'nome' ? { slug: slugify(valor) } : {}) })); setErro(null)
    }
    function alternar(campo: 'segmentoIds' | 'especialidadeIds', id: number) {
        setErro(null)
        setForm((atual) => {
            const selecionados = atual[campo]
            const removendo = selecionados.includes(id)
            const novosIds = removendo ? selecionados.filter((item) => item !== id) : [...selecionados, id]
            if (campo === 'especialidadeIds' || !removendo) return { ...atual, [campo]: novosIds }

            const idsIncompativeis = new Set(segmentos.find((segmento) => segmento.id === id)?.especialidades.map((item) => item.id) ?? [])
            return {
                ...atual,
                segmentoIds: novosIds,
                especialidadeIds: atual.especialidadeIds.filter((item) => !idsIncompativeis.has(item)),
            }
        })
    }
    async function submeter() {
        if (processando) return
        if (!form.nome || !form.nomeResponsavel || !form.emailResponsavel || form.senha.length < 6 || !form.segmentoIds.length || !form.especialidadeIds.length) {
            setErro('Preencha os dados obrigatórios e selecione segmento e especialidade.'); return
        }
        try {
            setProcessando(true); setErro(null)
            await httpPost('/saas/onboarding', {
                planoSlug: form.planoSlug,
                barbearia: { nome: form.nome, slug: form.slug, email: form.emailEstabelecimento, telefone: form.telefoneEstabelecimento,
                    tipoEstabelecimento: form.tipoEstabelecimento, modeloAtendimento: form.modeloAtendimento,
                    segmentoIds: form.segmentoIds, especialidadeIds: form.especialidadeIds },
                dono: { nome: form.nomeResponsavel, email: form.emailResponsavel, telefone: form.telefoneResponsavel, senha: form.senha },
            }, { escopoTenant: 'nenhum' })
            setConcluido(true)
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setProcessando(false) }
    }
    return { form, segmentos, especialidades, planos, processando, erro, concluido, alterar, alternar, submeter }
}

function slugify(valor: string) {
    return valor.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
