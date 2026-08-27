'use client'

import useAPI from '@/data/hooks/useAPI'
import { Star } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

export default function HistoricoAvaliacoes() {
    const { httpGet, httpPost, httpDelete } = useAPI()
    const [agendamentos, setAgendamentos] = useState<any[]>([])
    const [mensagem, setMensagem] = useState('')
    const [carregando, setCarregando] = useState(true)

    const carregar = useCallback(async function carregar() {
        setCarregando(true)
        const dados = await httpGet('/agendamentos')
        setAgendamentos(Array.isArray(dados) ? dados : [])
        setCarregando(false)
    }, [httpGet])

    useEffect(() => {
        carregar()
    }, [carregar])

    async function avaliar(id: number, nota: number, comentario: string) {
        setMensagem('')
        const resposta = await httpPost(`/agendamentos/${id}/avaliacao`, { nota, comentario })
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Avaliação registrada. Obrigado pelo feedback!')
    }

    async function cancelar(id: number) {
        setMensagem('')
        const resposta = await httpDelete(`/agendamentos/${id}`)
        if (resposta?.statusCode) return setMensagem(resposta.message)
        await carregar()
        setMensagem('Horário cancelado com sucesso.')
    }

    return (
        <section className="mt-10 grid gap-4">
            <div>
                <h2 className="text-2xl font-black text-zinc-100">Meus horários</h2>
                <p className="mt-1 text-sm text-zinc-400">Acompanhe seus agendamentos e avalie serviços já concluídos.</p>
            </div>

            {carregando && <p className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">Carregando horários...</p>}

            {!carregando && agendamentos.length === 0 && (
                <p className="rounded border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">Nenhum horário encontrado.</p>
            )}

            <div className="grid gap-3">
                {agendamentos.map((agendamento) => (
                    <Atendimento key={agendamento.id} agendamento={agendamento} onAvaliar={avaliar} onCancelar={cancelar} />
                ))}
            </div>

            {mensagem && <p className="text-sm text-zinc-300">{mensagem}</p>}
        </section>
    )
}

function Atendimento({
    agendamento,
    onAvaliar,
    onCancelar,
}: {
    agendamento: any
    onAvaliar: (id: number, nota: number, comentario: string) => void
    onCancelar: (id: number) => void
}) {
    const [nota, setNota] = useState(5)
    const [comentario, setComentario] = useState('')
    const podeAvaliar = agendamento.status === 'CONCLUIDO' && !agendamento.avaliacao
    const podeCancelar = ['AGENDADO', 'CONFIRMADO'].includes(agendamento.status) && new Date(agendamento.data).getTime() > Date.now()

    return (
        <article className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h3 className="font-bold text-zinc-100">{dataHora(agendamento.data)}</h3>
                    <p className="mt-1 text-sm text-zinc-400">
                        {agendamento.profissional?.nome ?? 'Profissional'} | {agendamento.servicos?.map((s: any) => s.nome).join(', ')}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">Status: {agendamento.status}</p>
                    {agendamento.avaliacao && (
                        <p className="mt-2 inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-sm text-zinc-300">
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            {agendamento.avaliacao.nota} avaliação enviada
                        </p>
                    )}
                    {podeCancelar && (
                        <button
                            type="button"
                            onClick={() => onCancelar(agendamento.id)}
                            className="mt-3 rounded border border-red-500/60 px-3 py-2 text-sm font-bold text-red-300"
                        >
                            Cancelar horário
                        </button>
                    )}
                </div>

                {podeAvaliar && (
                    <div className="grid gap-2 lg:w-80">
                        <select value={nota} onChange={(e) => setNota(Number(e.target.value))} className="input">
                            {[5, 4, 3, 2, 1].map((item) => (
                                <option key={item} value={item}>
                                    {item} estrela{item === 1 ? '' : 's'}
                                </option>
                            ))}
                        </select>
                        <textarea
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            placeholder="Comentário opcional"
                            className="input min-h-20"
                        />
                        <button type="button" onClick={() => onAvaliar(agendamento.id, nota, comentario)} className="rounded bg-yellow-400 px-4 py-2 font-bold text-black">
                            Avaliar
                        </button>
                    </div>
                )}
            </div>
        </article>
    )
}

function dataHora(valor: string) {
    return new Date(valor).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
