'use client'

import useAPI from '@/data/hooks/useAPI'
import { useCallback, useEffect, useState } from 'react'

interface HorarioFuncionamento {
    diaSemana: number
    inicio: string
    fim: string
    intervaloInicio: string
    intervaloFim: string
    ativo: boolean
}

interface ConfiguracaoAgenda {
    antecedenciaMinutos: number
    horarios: HorarioFuncionamento[]
}

const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const horariosPadrao: HorarioFuncionamento[] = [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({
    diaSemana,
    inicio: '08:00',
    fim: '21:00',
    intervaloInicio: '12:00',
    intervaloFim: '13:00',
    ativo: diaSemana !== 0,
}))

export default function FormularioConfiguracaoAgenda() {
    const { httpGet, httpPut } = useAPI()
    const [configuracao, setConfiguracao] = useState<ConfiguracaoAgenda>({
        antecedenciaMinutos: 30,
        horarios: horariosPadrao,
    })
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState('')

    const carregar = useCallback(async () => {
        setCarregando(true)
        const dados = await httpGet('/agenda/configuracao/horarios')
        setConfiguracao({
            antecedenciaMinutos: Number(dados?.antecedenciaMinutos ?? 30),
            horarios: mesclarHorarios(dados?.horarios ?? []),
        })
        setCarregando(false)
    }, [httpGet])

    useEffect(() => {
        carregar()
    }, [carregar])

    function atualizarHorario(diaSemana: number, campo: keyof HorarioFuncionamento, valor: any) {
        setMensagem('')
        setConfiguracao((atual) => ({
            ...atual,
            horarios: atual.horarios.map((horario) =>
                horario.diaSemana === diaSemana ? { ...horario, [campo]: valor } : horario
            ),
        }))
    }

    async function salvar() {
        setSalvando(true)
        setMensagem('')

        const resposta = await httpPut('/agenda/configuracao/horarios', configuracao)
        setSalvando(false)

        if (resposta?.statusCode && resposta.statusCode >= 400) {
            setMensagem(resposta.message ?? 'Não foi possível salvar as configurações.')
            return
        }

        setConfiguracao({
            antecedenciaMinutos: Number(resposta?.antecedenciaMinutos ?? configuracao.antecedenciaMinutos),
            horarios: mesclarHorarios(resposta?.horarios ?? configuracao.horarios),
        })
        setMensagem('Configurações salvas com sucesso.')
    }

    if (carregando) {
        return <div className="rounded bg-zinc-900 p-6 text-zinc-400">Carregando configurações...</div>
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid gap-2">
                <label className="text-sm uppercase text-zinc-400">Antecedência mínima</label>
                <input
                    type="number"
                    min={0}
                    step={5}
                    value={configuracao.antecedenciaMinutos}
                    onChange={(e) =>
                        setConfiguracao((atual) => ({
                            ...atual,
                            antecedenciaMinutos: Number(e.target.value),
                        }))
                    }
                    className="input max-w-xs"
                />
            </div>

            <div className="overflow-x-auto rounded border border-zinc-800">
                <table className="w-full min-w-[760px] border-collapse bg-zinc-950">
                    <thead className="bg-zinc-900 text-left text-xs uppercase text-zinc-400">
                        <tr>
                            <th className="p-3">Dia</th>
                            <th className="p-3">Ativo</th>
                            <th className="p-3">Início</th>
                            <th className="p-3">Fim</th>
                            <th className="p-3">Almoço início</th>
                            <th className="p-3">Almoço fim</th>
                        </tr>
                    </thead>
                    <tbody>
                        {configuracao.horarios.map((horario) => (
                            <tr key={horario.diaSemana} className="border-t border-zinc-800">
                                <td className="p-3 font-semibold">{nomesDias[horario.diaSemana]}</td>
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={horario.ativo}
                                        onChange={(e) =>
                                            atualizarHorario(
                                                horario.diaSemana,
                                                'ativo',
                                                e.target.checked
                                            )
                                        }
                                        className="h-5 w-5 accent-yellow-400"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="time"
                                        value={horario.inicio}
                                        onChange={(e) =>
                                            atualizarHorario(horario.diaSemana, 'inicio', e.target.value)
                                        }
                                        className="input"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="time"
                                        value={horario.fim}
                                        onChange={(e) =>
                                            atualizarHorario(horario.diaSemana, 'fim', e.target.value)
                                        }
                                        className="input"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="time"
                                        value={horario.intervaloInicio}
                                        onChange={(e) =>
                                            atualizarHorario(
                                                horario.diaSemana,
                                                'intervaloInicio',
                                                e.target.value
                                            )
                                        }
                                        className="input"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="time"
                                        value={horario.intervaloFim}
                                        onChange={(e) =>
                                            atualizarHorario(
                                                horario.diaSemana,
                                                'intervaloFim',
                                                e.target.value
                                            )
                                        }
                                        className="input"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={salvar}
                    disabled={salvando}
                    className="rounded bg-yellow-400 px-5 py-3 font-semibold text-black disabled:opacity-50"
                >
                    {salvando ? 'Salvando...' : 'Salvar configurações'}
                </button>
                {mensagem && <span className="text-sm text-zinc-300">{mensagem}</span>}
            </div>
        </div>
    )
}

function mesclarHorarios(horarios: any[]): HorarioFuncionamento[] {
    return horariosPadrao.map((padrao) => {
        const horario = horarios.find((item) => item.diaSemana === padrao.diaSemana)
        return {
            ...padrao,
            ...horario,
            intervaloInicio: horario?.intervaloInicio ?? padrao.intervaloInicio,
            intervaloFim: horario?.intervaloFim ?? padrao.intervaloFim,
            ativo: horario?.ativo ?? padrao.ativo,
        }
    })
}
