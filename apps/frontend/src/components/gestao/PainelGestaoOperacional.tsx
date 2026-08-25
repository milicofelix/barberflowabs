'use client'

import useAPI from '@/data/hooks/useAPI'
import { Profissional, Servico } from '@barbabrutal/core'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'

type Aba = 'servicos' | 'profissionais'

const servicoVazio: Omit<Servico, 'id'> = {
    nome: '',
    descricao: '',
    preco: 50,
    qtdeSlots: 2,
    imagemURL: '/servicos/corte-de-cabelo.jpg',
}

const profissionalVazio: Omit<Profissional, 'id'> = {
    nome: '',
    descricao: '',
    imagemURL: '/profissionais/profissional-1.jpg',
    avaliacao: 5,
    quantidadeAvaliacoes: 0,
}

export default function PainelGestaoOperacional() {
    const { httpGet, httpPost, httpPut, httpDelete } = useAPI()
    const [aba, setAba] = useState<Aba>('servicos')
    const [servicos, setServicos] = useState<Servico[]>([])
    const [profissionais, setProfissionais] = useState<Profissional[]>([])
    const [servico, setServico] = useState<any>(servicoVazio)
    const [profissional, setProfissional] = useState<any>(profissionalVazio)
    const [mensagem, setMensagem] = useState('')

    const carregar = useCallback(async () => {
        const [dadosServicos, dadosProfissionais] = await Promise.all([
            httpGet('/servicos'),
            httpGet('/profissionais'),
        ])
        setServicos(Array.isArray(dadosServicos) ? dadosServicos : [])
        setProfissionais(Array.isArray(dadosProfissionais) ? dadosProfissionais : [])
    }, [httpGet])

    useEffect(() => {
        carregar()
    }, [carregar])

    async function salvarServico() {
        setMensagem('')
        const payload = {
            nome: servico.nome,
            descricao: servico.descricao,
            preco: Number(servico.preco),
            qtdeSlots: Number(servico.qtdeSlots),
            imagemURL: servico.imagemURL,
        }
        const resposta = servico.id
            ? await httpPut(`/servicos/${servico.id}`, payload)
            : await httpPost('/servicos', payload)

        if (resposta?.statusCode) return setMensagem(resposta.message)

        setServico(servicoVazio)
        await carregar()
        setMensagem('Serviço salvo.')
    }

    async function excluirServico(id: number) {
        setMensagem('')
        const resposta = await httpDelete(`/servicos/${id}`)
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Serviço excluído.')
    }

    async function salvarProfissional() {
        setMensagem('')
        const payload = {
            nome: profissional.nome,
            descricao: profissional.descricao,
            imagemURL: profissional.imagemURL,
            avaliacao: Number(profissional.avaliacao ?? 5),
            quantidadeAvaliacoes: Number(profissional.quantidadeAvaliacoes ?? 0),
        }
        const resposta = profissional.id
            ? await httpPut(`/profissionais/${profissional.id}`, payload)
            : await httpPost('/profissionais', payload)

        if (resposta?.statusCode) return setMensagem(resposta.message)

        setProfissional(profissionalVazio)
        await carregar()
        setMensagem('Profissional salvo.')
    }

    async function excluirProfissional(id: number) {
        setMensagem('')
        const resposta = await httpDelete(`/profissionais/${id}`)
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Profissional excluído.')
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => setAba('servicos')}
                    className={botaoAba(aba === 'servicos')}
                >
                    Serviços
                </button>
                <button
                    type="button"
                    onClick={() => setAba('profissionais')}
                    className={botaoAba(aba === 'profissionais')}
                >
                    Profissionais
                </button>
            </div>

            {aba === 'servicos' ? (
                <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <FormularioServico
                        servico={servico}
                        onChange={setServico}
                        onSubmit={salvarServico}
                        onNovo={() => setServico(servicoVazio)}
                    />
                    <ListaServicos
                        servicos={servicos}
                        onEditar={setServico}
                        onExcluir={excluirServico}
                    />
                </section>
            ) : (
                <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <FormularioProfissional
                        profissional={profissional}
                        onChange={setProfissional}
                        onSubmit={salvarProfissional}
                        onNovo={() => setProfissional(profissionalVazio)}
                    />
                    <ListaProfissionais
                        profissionais={profissionais}
                        onEditar={setProfissional}
                        onExcluir={excluirProfissional}
                    />
                </section>
            )}

            {mensagem && <span className="text-sm text-zinc-300">{mensagem}</span>}
        </div>
    )
}

function FormularioServico(props: any) {
    return (
        <FormularioBase
            titulo={props.servico.id ? 'Editar serviço' : 'Novo serviço'}
            onSubmit={props.onSubmit}
            onNovo={props.onNovo}
        >
            <Campo label="Nome" value={props.servico.nome} onChange={(nome) => props.onChange({ ...props.servico, nome })} />
            <Campo label="Descrição" value={props.servico.descricao} onChange={(descricao) => props.onChange({ ...props.servico, descricao })} />
            <Campo label="Imagem" value={props.servico.imagemURL} onChange={(imagemURL) => props.onChange({ ...props.servico, imagemURL })} />
            <Campo label="Preço" type="number" value={props.servico.preco} onChange={(preco) => props.onChange({ ...props.servico, preco })} />
            <Campo label="Slots de 15 min" type="number" value={props.servico.qtdeSlots} onChange={(qtdeSlots) => props.onChange({ ...props.servico, qtdeSlots })} />
        </FormularioBase>
    )
}

function FormularioProfissional(props: any) {
    return (
        <FormularioBase
            titulo={props.profissional.id ? 'Editar profissional' : 'Novo profissional'}
            onSubmit={props.onSubmit}
            onNovo={props.onNovo}
        >
            <Campo label="Nome" value={props.profissional.nome} onChange={(nome) => props.onChange({ ...props.profissional, nome })} />
            <Campo label="Descrição" value={props.profissional.descricao} onChange={(descricao) => props.onChange({ ...props.profissional, descricao })} />
            <Campo label="Imagem" value={props.profissional.imagemURL} onChange={(imagemURL) => props.onChange({ ...props.profissional, imagemURL })} />
            <Campo label="Avaliação" type="number" value={props.profissional.avaliacao} onChange={(avaliacao) => props.onChange({ ...props.profissional, avaliacao })} />
        </FormularioBase>
    )
}

function FormularioBase(props: any) {
    return (
        <div className="flex flex-col gap-4 rounded border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-100">{props.titulo}</h2>
                <button type="button" onClick={props.onNovo} className="rounded bg-zinc-800 p-2 text-zinc-200">
                    <IconPlus size={18} />
                </button>
            </div>
            {props.children}
            <button
                type="button"
                onClick={props.onSubmit}
                className="rounded bg-yellow-400 px-4 py-3 font-semibold text-black"
            >
                Salvar
            </button>
        </div>
    )
}

function Campo(props: {
    label: string
    value: any
    type?: string
    onChange: (valor: string) => void
}) {
    return (
        <label className="flex flex-col gap-2 text-sm text-zinc-400">
            {props.label}
            <input
                type={props.type ?? 'text'}
                value={props.value ?? ''}
                onChange={(e) => props.onChange(e.target.value)}
                className="input"
            />
        </label>
    )
}

function ListaServicos(props: {
    servicos: Servico[]
    onEditar: (servico: Servico) => void
    onExcluir: (id: number) => void
}) {
    return (
        <div className="grid gap-3">
            {props.servicos.map((servico) => (
                <Linha
                    key={servico.id}
                    titulo={servico.nome}
                    detalhe={`R$ ${Number(servico.preco).toFixed(2)} | ${servico.qtdeSlots * 15} min`}
                    onEditar={() => props.onEditar(servico)}
                    onExcluir={() => props.onExcluir(servico.id)}
                />
            ))}
        </div>
    )
}

function ListaProfissionais(props: {
    profissionais: Profissional[]
    onEditar: (profissional: Profissional) => void
    onExcluir: (id: number) => void
}) {
    return (
        <div className="grid gap-3">
            {props.profissionais.map((profissional) => (
                <Linha
                    key={profissional.id}
                    titulo={profissional.nome}
                    detalhe={`${profissional.avaliacao.toFixed(1)} | ${profissional.quantidadeAvaliacoes} avaliações`}
                    onEditar={() => props.onEditar(profissional)}
                    onExcluir={() => props.onExcluir(profissional.id)}
                />
            ))}
        </div>
    )
}

function Linha(props: {
    titulo: string
    detalhe: string
    onEditar: () => void
    onExcluir: () => void
}) {
    return (
        <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 p-4">
            <div className="min-w-0">
                <h3 className="truncate font-bold text-zinc-100">{props.titulo}</h3>
                <p className="text-sm text-zinc-400">{props.detalhe}</p>
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={props.onEditar} className="rounded bg-zinc-800 p-2 text-zinc-200">
                    <IconPencil size={18} />
                </button>
                <button type="button" onClick={props.onExcluir} className="rounded bg-red-500/15 p-2 text-red-400">
                    <IconTrash size={18} />
                </button>
            </div>
        </div>
    )
}

function botaoAba(ativo: boolean) {
    return [
        'rounded px-4 py-2 font-semibold',
        ativo ? 'bg-yellow-400 text-black' : 'bg-zinc-900 text-zinc-300',
    ].join(' ')
}
