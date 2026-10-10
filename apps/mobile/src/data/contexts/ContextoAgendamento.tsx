import { AgendaUtils, DateUtils, Horarios, Profissional, Servico } from '@uniflowabs/core'
import { createContext, useCallback, useEffect, useState } from 'react'
import useAPI from '../hooks/useAPI'
import useSessao from '../hooks/useSessao'
import useEstabelecimento from '../hooks/useEstabelecimento'

interface HorariosDisponiveis {
    manha: string[]
    tardeNoite: string[]
}

export interface ContextoAgendamentoProps {
    profissional: Profissional | null
    servicos: Servico[]
    data: Date | null
    dataValida: Date | null
    horariosOcupados: string[]
    horariosDisponiveis: HorariosDisponiveis
    selecionarProfissional: (profissional: Profissional | null) => void
    selecionarServicos: (servicos: Servico[]) => void
    selecionarData: (data: Date) => void
    agendar: () => Promise<void>
    podeAgendar: () => boolean
    duracaoTotal: () => string
    precoTotal: () => number
    qtdeHorarios: () => number
}

const ContextoAgendamento = createContext<ContextoAgendamentoProps>({} as any)

function formatarDia(data: Date) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
}

export function ProvedorAgendamento(props: any) {
    const { httpPost, httpGet } = useAPI()
    const { usuario } = useSessao()
    const { estabelecimento } = useEstabelecimento()

    const [horariosOcupados, setHorariosOcupados] = useState<string[]>([])
    const [horariosDisponiveis, setHorariosDisponiveis] = useState<HorariosDisponiveis>(
        AgendaUtils.horariosDoDia()
    )
    const [profissional, setProfissional] = useState<Profissional | null>(null)
    const [servicos, setServicos] = useState<Servico[]>([])
    const [data, setData] = useState<Date>(DateUtils.hojeComHoraZerada())

    const dia = formatarDia(data)
    const todosHorariosDisponiveis = [...horariosDisponiveis.manha, ...horariosDisponiveis.tardeNoite]

    function podeAgendar(): boolean {
        if (!profissional) return false
        if (servicos.length === 0) return false
        if (!data) return false
        return horarioEstaDisponivel(data)
    }

    function duracaoTotal() {
        return AgendaUtils.duracaoTotal(servicos)
    }

    function qtdeHorarios() {
        return AgendaUtils.qtdeHorarios(servicos)
    }

    async function agendar() {
        if (!estabelecimento) throw new Error('Escolha um estabelecimento antes de continuar.')

        await httpPost('/agendamentos', {
            data,
            usuario,
            profissional,
            servicos,
        }, { escopoTenant: 'publico' })

        limpar()
    }

    function limpar() {
        setProfissional(null)
        setServicos([])
        setData(DateUtils.hojeComHoraZerada())
    }

    function precoTotal() {
        return servicos.reduce((acc, servico) => acc + servico.preco, 0)
    }

    function horarioEstaDisponivel(data: Date) {
        if (qtdeHorarios() <= 0) return false

        const horario = data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        })
        if (!todosHorariosDisponiveis.includes(horario)) return false

        const horarios = new Horarios(
            horario,
            qtdeHorarios(),
            horariosOcupados,
            todosHorariosDisponiveis
        )
        return horarios.completo && !horarios.ocupado
    }

    const obterHorariosOcupados = useCallback(
        async function (dia: string, profissional: Profissional): Promise<string[]> {
            if (!dia || !profissional) return []
            const ocupacao = await httpGet<string[]>(`agendamentos/ocupacao/${profissional!.id}/${dia}`, {
                escopoTenant: 'publico',
            })
            return ocupacao ?? []
        },
        [httpGet]
    )

    const obterHorariosDisponiveis = useCallback(
        async function (
            dia: string,
            profissional: Profissional | null
        ): Promise<HorariosDisponiveis> {
            if (!dia) return AgendaUtils.horariosDoDia()

            const profissionalQuery = profissional ? `?profissionalId=${profissional.id}` : ''
            const horarios = await httpGet<HorariosDisponiveis>(`agenda/horarios/${dia}${profissionalQuery}`, {
                escopoTenant: 'publico',
            })
            return horarios?.manha && horarios?.tardeNoite ? horarios : AgendaUtils.horariosDoDia()
        },
        [httpGet]
    )

    useEffect(() => {
        setProfissional(null)
        setServicos([])
        setData(DateUtils.hojeComHoraZerada())
    }, [estabelecimento?.id])

    useEffect(() => {
        if (!estabelecimento || !dia || !profissional) {
            setHorariosOcupados([])
            return
        }
        obterHorariosOcupados(dia, profissional).then(setHorariosOcupados).catch(() => setHorariosOcupados([]))
    }, [estabelecimento, dia, profissional, obterHorariosOcupados])

    useEffect(() => {
        if (!estabelecimento) {
            setHorariosDisponiveis(AgendaUtils.horariosDoDia())
            return
        }
        obterHorariosDisponiveis(dia, profissional)
            .then(setHorariosDisponiveis)
            .catch(() => setHorariosDisponiveis(AgendaUtils.horariosDoDia()))
    }, [estabelecimento, dia, profissional, obterHorariosDisponiveis])

    useEffect(() => {
        const horarioSelecionado = data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        })
        if (horarioSelecionado === '00:00' || horarioEstaDisponivel(data)) return

        setData(DateUtils.aplicarHorario(data, '00:00'))
    }, [horariosOcupados, horariosDisponiveis, servicos])

    return (
        <ContextoAgendamento.Provider
            value={{
                profissional,
                servicos,
                data,
                get dataValida() {
                    if (!data) return null
                    if (!horarioEstaDisponivel(data)) return null
                    return data
                },
                horariosOcupados,
                horariosDisponiveis,
                selecionarProfissional: setProfissional,
                selecionarServicos: setServicos,
                selecionarData: setData,
                agendar,
                podeAgendar,
                duracaoTotal,
                precoTotal,
                qtdeHorarios,
            }}
        >
            {props.children}
        </ContextoAgendamento.Provider>
    )
}

export default ContextoAgendamento
