'use client'
import { createContext, useCallback, useEffect, useState } from 'react'
import useAPI from '../hooks/useAPI'
import useSessao from '../hooks/useSessao'
import { AgendaUtils, DateUtils, Horarios, Profissional, Servico } from '@barbabrutal/core'
import { useRouter } from 'next/navigation'

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
    mensagem: string
    agendando: boolean
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
    const router = useRouter()

    const [horariosOcupados, setHorariosOcupados] = useState<string[]>([])
    const [horariosDisponiveis, setHorariosDisponiveis] = useState<HorariosDisponiveis>(
        AgendaUtils.horariosDoDia()
    )
    const [profissional, setProfissional] = useState<Profissional | null>(null)
    const [servicos, setServicos] = useState<Servico[]>([])
    const [data, setData] = useState<Date>(DateUtils.hojeComHoraZerada())
    const [mensagem, setMensagem] = useState('')
    const [agendando, setAgendando] = useState(false)

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
        if (agendando || !podeAgendar()) return

        setAgendando(true)
        setMensagem('')

        try {
            const resposta = await httpPost('/agendamentos', {
                data,
                usuario,
                profissional,
                servicos,
            })

            if (resposta?.statusCode) {
                setMensagem(resposta.message ?? 'Não foi possível criar o agendamento.')
                return
            }

            router.push('/agendamento/sucesso')
            limpar()
        } finally {
            setAgendando(false)
        }
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
            const ocupacao = await httpGet(`agendamentos/ocupacao/${profissional!.id}/${dia}`)
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
            const horarios = await httpGet(`agenda/horarios/${dia}${profissionalQuery}`)
            return horarios?.manha && horarios?.tardeNoite ? horarios : AgendaUtils.horariosDoDia()
        },
        [httpGet]
    )

    useEffect(() => {
        if (!dia || !profissional) {
            setHorariosOcupados([])
            return
        }
        obterHorariosOcupados(dia, profissional).then(setHorariosOcupados)
    }, [dia, profissional, obterHorariosOcupados])

    useEffect(() => {
        obterHorariosDisponiveis(dia, profissional).then(setHorariosDisponiveis)
    }, [dia, profissional, obterHorariosDisponiveis])

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
                mensagem,
                agendando,
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
