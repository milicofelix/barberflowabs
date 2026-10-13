import { AgendaUtils, DateUtils, Horarios, Profissional, Servico } from '@uniflowabs/core'
import { createContext, useCallback, useEffect, useState } from 'react'
import useAPI from '../hooks/useAPI'
import useSessao from '../hooks/useSessao'
import useEstabelecimento from '../hooks/useEstabelecimento'

interface HorariosDisponiveis {
    manha: string[]
    tardeNoite: string[]
}

export interface OpcoesAgendamentoAssistido {
    unidadeId?: number | null
    modeloAtendimento?: 'PRESENCIAL' | 'DOMICILIAR' | 'HIBRIDO'
    enderecoAtendimento?: string | null
    deslocamentoMinutos?: number
    origem?: 'RECEPCAO' | 'TELEFONE' | 'WHATSAPP' | 'PRESENCIAL' | 'OUTRO'
    observacoes?: string | null
}

export interface ContextoAgendamentoProps {
    profissional: Profissional | null
    servicos: Servico[]
    data: Date | null
    dataValida: Date | null
    unidadeId: number | null
    horariosOcupados: string[]
    horariosDisponiveis: HorariosDisponiveis
    selecionarProfissional: (profissional: Profissional | null) => void
    selecionarServicos: (servicos: Servico[]) => void
    selecionarData: (data: Date) => void
    agendar: () => Promise<void>
    selecionarUnidade: (unidadeId: number | null) => void
    agendarPara: (clienteId: number, opcoes?: OpcoesAgendamentoAssistido) => Promise<void>
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
    const papel = String(usuario?.role ?? usuario?.papel ?? '').toUpperCase()
    const contextoOperacional = papel === 'ESTABLISHMENT_MEMBER' || papel === 'ESTABLISHMENT_OWNER' || Boolean(usuario?.membroEstabelecimento)

    const [horariosOcupados, setHorariosOcupados] = useState<string[]>([])
    const [horariosDisponiveis, setHorariosDisponiveis] = useState<HorariosDisponiveis>(
        AgendaUtils.horariosDoDia()
    )
    const [profissional, setProfissional] = useState<Profissional | null>(null)
    const [servicos, setServicos] = useState<Servico[]>([])
    const [data, setData] = useState<Date>(DateUtils.hojeComHoraZerada())
    const [unidadeId, setUnidadeId] = useState<number | null>(null)

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

    async function agendarPara(clienteId: number, opcoes: OpcoesAgendamentoAssistido = {}) {
        if (!Number.isInteger(clienteId) || clienteId <= 0) throw new Error('Selecione um cliente.')
        await httpPost('/gestao/agendamentos', {
            clienteId,
            data,
            profissional,
            servicos,
            ...opcoes,
            unidadeId: opcoes.unidadeId ?? unidadeId,
        })
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
            const ocupacao = await httpGet<string[]>(`agendamentos/ocupacao/${profissional!.id}/${dia}`)
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

            const parametros = new URLSearchParams()
            if (profissional) parametros.set('profissionalId', String(profissional.id))
            if (unidadeId) parametros.set('unidadeId', String(unidadeId))
            const profissionalQuery = parametros.size ? `?${parametros.toString()}` : ''
            const horarios = await httpGet<HorariosDisponiveis>(`agenda/horarios/${dia}${profissionalQuery}`)
            return horarios?.manha && horarios?.tardeNoite ? horarios : AgendaUtils.horariosDoDia()
        },
        [httpGet, unidadeId]
    )

    useEffect(() => {
        setProfissional(null)
        setServicos([])
        setData(DateUtils.hojeComHoraZerada())
        setUnidadeId(null)
    }, [estabelecimento?.id, usuario?.estabelecimentoId])

    useEffect(() => {
        if ((!estabelecimento && !contextoOperacional) || !dia || !profissional) {
            setHorariosOcupados([])
            return
        }
        obterHorariosOcupados(dia, profissional).then(setHorariosOcupados).catch(() => setHorariosOcupados([]))
    }, [estabelecimento, contextoOperacional, dia, profissional, obterHorariosOcupados])

    useEffect(() => {
        if (!estabelecimento && !contextoOperacional) {
            setHorariosDisponiveis(AgendaUtils.horariosDoDia())
            return
        }
        obterHorariosDisponiveis(dia, profissional)
            .then(setHorariosDisponiveis)
            .catch(() => setHorariosDisponiveis(AgendaUtils.horariosDoDia()))
    }, [estabelecimento, contextoOperacional, dia, profissional, obterHorariosDisponiveis])

    useEffect(() => {
        const horarioSelecionado = data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        })
        // Mantém o horário vindo da agenda operacional enquanto profissional e
        // serviços ainda estão sendo escolhidos. Com o contexto completo, a
        // disponibilidade volta a ser validada normalmente.
        if (horarioSelecionado === '00:00' || !profissional || !servicos.length || horarioEstaDisponivel(data)) return

        setData(DateUtils.aplicarHorario(data, '00:00'))
    }, [horariosOcupados, horariosDisponiveis, servicos])

    return (
        <ContextoAgendamento.Provider
            value={{
                profissional,
                servicos,
                data,
                unidadeId,
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
                selecionarUnidade: setUnidadeId,
                agendar,
                agendarPara,
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
