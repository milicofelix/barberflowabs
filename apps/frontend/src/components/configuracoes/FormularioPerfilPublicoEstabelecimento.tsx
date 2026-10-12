'use client'

import useAPI from '@/data/hooks/useAPI'
import { MapPinned, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

const perfilVazio = {
    nomePublico: '',
    descricaoPublica: '',
    imagemCapaURL: '',
    telefone: '',
    email: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    latitude: '',
    longitude: '',
    aceitaAgendamentoOnline: true,
    observacaoRevisao: '',
}

export default function FormularioPerfilPublicoEstabelecimento() {
    const { httpGet, httpPut } = useAPI()
    const [perfil, setPerfil] = useState<any>(perfilVazio)
    const [prontidao, setProntidao] = useState<any>(null)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState('')

    const carregar = useCallback(async () => {
        setCarregando(true)
        const [dados, dadosProntidao] = await Promise.all([
            httpGet('/estabelecimentos/minha/perfil-publico'),
            httpGet('/estabelecimentos/minha/prontidao-publicacao'),
        ])

        if (dados?.statusCode && dados.statusCode >= 400) {
            setMensagem(dados.message ?? 'Não foi possível carregar o perfil público.')
            setCarregando(false)
            return
        }

        setPerfil(normalizarPerfil(dados))
        setProntidao(dadosProntidao)
        setCarregando(false)
    }, [httpGet])

    useEffect(() => {
        carregar()
    }, [carregar])

    function atualizar(campo: string, valor: any) {
        setMensagem('')
        setPerfil((atual: any) => ({ ...atual, [campo]: valor }))
    }

    async function salvar() {
        setSalvando(true)
        setMensagem('')

        const resposta = await httpPut('/estabelecimentos/minha/perfil-publico', {
            ...perfil,
            latitude: perfil.latitude === '' ? null : Number(perfil.latitude),
            longitude: perfil.longitude === '' ? null : Number(perfil.longitude),
        })

        setSalvando(false)

        if (resposta?.statusCode && resposta.statusCode >= 400) {
            setMensagem(resposta.message ?? 'Não foi possível salvar o perfil público.')
            return
        }

        setPerfil(normalizarPerfil(resposta))
        const dadosProntidao = await httpGet('/estabelecimentos/minha/prontidao-publicacao')
        setProntidao(dadosProntidao)
        setMensagem(
            resposta?.reviewStatus === 'PENDING_REVIEW'
                ? 'Perfil salvo e enviado para revisão do admin.'
                : 'Perfil público salvo com sucesso.',
        )
    }

    if (carregando) {
        return <div className="rounded bg-zinc-900 p-6 text-zinc-400">Carregando perfil público...</div>
    }

    return (
        <div className="grid gap-6">
            <StatusPerfil perfil={perfil} />
            {prontidao && <ProntidaoPublicacao dados={prontidao} />}

            <div className="grid gap-4 lg:grid-cols-2">
                <Campo texto="Nome público" valor={perfil.nomePublico} onChange={(valor) => atualizar('nomePublico', valor)} />
                <Campo texto="Imagem de capa" valor={perfil.imagemCapaURL} onChange={(valor) => atualizar('imagemCapaURL', valor)} placeholder="/banners/principal.png" />
                <Campo texto="Telefone público" valor={perfil.telefone} onChange={(valor) => atualizar('telefone', valor)} />
                <Campo texto="E-mail público" valor={perfil.email} onChange={(valor) => atualizar('email', valor)} />
            </div>

            <label className="grid gap-2">
                <span className="text-sm uppercase text-zinc-400">Descrição pública</span>
                <textarea
                    value={perfil.descricaoPublica}
                    onChange={(e) => atualizar('descricaoPublica', e.target.value)}
                    rows={4}
                    className="input min-h-[120px]"
                />
            </label>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr_.8fr_.35fr]">
                <Campo texto="Endereço" valor={perfil.endereco} onChange={(valor) => atualizar('endereco', valor)} />
                <Campo texto="Bairro" valor={perfil.bairro} onChange={(valor) => atualizar('bairro', valor)} />
                <Campo texto="Cidade" valor={perfil.cidade} onChange={(valor) => atualizar('cidade', valor)} />
                <Campo texto="UF" valor={perfil.estado} onChange={(valor) => atualizar('estado', valor.toUpperCase().slice(0, 2))} />
            </div>

            <p className="rounded border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">A localização no mapa é validada pelo superadmin a partir do endereço informado. O responsável não precisa preencher latitude ou longitude.</p>

            <label className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
                <input
                    type="checkbox"
                    checked={perfil.aceitaAgendamentoOnline}
                    onChange={(e) => atualizar('aceitaAgendamentoOnline', e.target.checked)}
                    className="h-5 w-5 accent-yellow-400"
                />
                Aceita agendamento online pelo perfil público
            </label>

            <label className="grid gap-2">
                <span className="text-sm uppercase text-zinc-400">Observação para revisão</span>
                <textarea
                    value={perfil.observacaoRevisao}
                    onChange={(e) => atualizar('observacaoRevisao', e.target.value)}
                    rows={3}
                    className="input min-h-[90px]"
                />
            </label>

            <div className="flex flex-wrap items-center gap-4">
                <button
                    type="button"
                    onClick={salvar}
                    disabled={salvando}
                    className="inline-flex items-center gap-2 rounded bg-yellow-400 px-5 py-3 font-semibold text-black disabled:opacity-50"
                >
                    <Save size={18} />
                    {salvando ? 'Salvando...' : 'Salvar perfil público'}
                </button>
                {mensagem && <span className="text-sm text-zinc-300">{mensagem}</span>}
            </div>
        </div>
    )
}

function ProntidaoPublicacao({ dados }: { dados: any }) {
    return (
        <section className={`grid gap-4 rounded border bg-card p-5 ${dados.prontoParaMapa ? 'border-emerald-500/50' : 'border-amber-500/40'}`}>
            <header className="flex items-start justify-between gap-4">
                <div><h3 className="text-lg font-black text-foreground">Preparação para publicação</h3>
                    <p className="text-sm text-muted-foreground">{dados.prontoParaMapa ? 'O estabelecimento está pronto para a lista e o mapa.' : 'Conclua as pendências abaixo para aparecer publicamente.'}</p></div>
                <strong className={dados.prontoParaMapa ? 'text-emerald-400' : 'text-yellow-400'}>{dados.progresso}%</strong>
            </header>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className={`rounded-full px-3 py-2 ${dados.prontoParaLista ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{dados.prontoParaLista ? '✓ Lista pública' : '○ Lista pública'}</span>
                <span className={`rounded-full px-3 py-2 ${dados.prontoParaMapa ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>{dados.prontoParaMapa ? '✓ Mapa' : '○ Mapa'}</span>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
                {dados.itens.map((item: any) => <li key={item.codigo} className="flex gap-3 rounded border border-border bg-background/60 p-3">
                    <span className={item.concluido ? 'font-black text-emerald-400' : 'font-black text-amber-400'}>{item.concluido ? '✓' : '!'}</span>
                    <div><strong className="block text-sm text-foreground">{item.titulo}</strong>{!item.concluido && <span className="text-xs text-muted-foreground">{item.orientacao}</span>}</div>
                </li>)}
            </ul>
        </section>
    )
}

function StatusPerfil({ perfil }: { perfil: any }) {
    const coordenadasOk = perfil.latitude !== '' && perfil.longitude !== ''
    const status = perfil.reviewStatus

    return (
        <div className="grid gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-3">
            <Indicador titulo="Revisão administrativa" valor={status === 'APPROVED' ? 'Aprovado' : status === 'REJECTED' ? 'Reprovado' : 'Em revisão'} destaque={status === 'APPROVED'} />
            <Indicador titulo="Mapa" valor={coordenadasOk ? 'Com coordenadas' : 'Sem coordenadas'} destaque={coordenadasOk} />
            <Indicador titulo="Agendamento" valor={perfil.aceitaAgendamentoOnline ? 'Online ativo' : 'Online pausado'} destaque={perfil.aceitaAgendamentoOnline} />
            {perfil.reviewReason && <p className="text-sm text-zinc-400 md:col-span-3">{perfil.reviewReason}</p>}
        </div>
    )
}

function Indicador({ titulo, valor, destaque }: { titulo: string; valor: string; destaque: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 place-items-center rounded ${destaque ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-300'}`}>
                <MapPinned size={18} />
            </span>
            <div>
                <p className="text-xs uppercase text-zinc-500">{titulo}</p>
                <strong className="text-sm text-zinc-100">{valor}</strong>
            </div>
        </div>
    )
}

function Campo({ texto, valor, onChange, placeholder, tipo = 'text' }: { texto: string; valor: string; onChange: (valor: string) => void; placeholder?: string; tipo?: string }) {
    return (
        <label className="grid gap-2">
            <span className="text-sm uppercase text-zinc-400">{texto}</span>
            <input
                type={tipo}
                value={valor}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="input"
            />
        </label>
    )
}

function normalizarPerfil(dados: any) {
    return {
        ...perfilVazio,
        ...dados,
        nomePublico: dados?.nomePublico ?? dados?.nome ?? '',
        descricaoPublica: dados?.descricaoPublica ?? '',
        imagemCapaURL: dados?.imagemCapaURL ?? '/banners/principal.png',
        telefone: dados?.telefone ?? '',
        email: dados?.email ?? '',
        endereco: dados?.endereco ?? '',
        bairro: dados?.bairro ?? '',
        cidade: dados?.cidade ?? '',
        estado: dados?.estado ?? '',
        latitude: dados?.latitude === null || dados?.latitude === undefined ? '' : String(dados.latitude),
        longitude: dados?.longitude === null || dados?.longitude === undefined ? '' : String(dados.longitude),
        aceitaAgendamentoOnline: dados?.aceitaAgendamentoOnline ?? true,
        observacaoRevisao: '',
    }
}
