import { AgendaUtils, DateUtils, Horarios } from '@barbabrutal/core'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

export interface HorariosDisponiveis {
    manha: string[]
    tardeNoite: string[]
}

interface CampoHorarioProps {
    value: Date
    qtdeHorarios: number
    horariosOcupados: string[]
    horariosDisponiveis?: HorariosDisponiveis
    onChange(data: Date): void
}

export default function CampoHorario(props: CampoHorarioProps) {
    const { cores } = useTema()
    const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null)
    const { manha, tardeNoite } = props.horariosDisponiveis ?? AgendaUtils.horariosDoDia()
    const { horariosOcupados } = props
    const todosHorariosDisponiveis = [...manha, ...tardeNoite]

    const dia = props.value.toISOString().slice(0, 10) ?? ''

    useEffect(() => {
        const horarioAtual = props.value.toLocaleString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        })
        setHoraSelecionada(horarioAtual)
    }, [dia])

    function renderizarHorario(horario: string) {
        const intervalo = new Horarios(
            horario,
            props.qtdeHorarios,
            horariosOcupados,
            todosHorariosDisponiveis
        )
        const indisponivel = intervalo.ocupado || intervalo.incompleto
        const selecionado = horaSelecionada === horario && !indisponivel

        return (
            <Pressable
                key={horario}
                disabled={indisponivel}
                accessibilityState={{ disabled: indisponivel, selected: selecionado }}
                accessibilityLabel={indisponivel ? `${horario}, horário indisponível` : horario}
                onPress={function () {
                    setHoraSelecionada(horario)
                    props.onChange(DateUtils.aplicarHorario(props.value, horario))
                }}
                style={[styles.horaContainer, { backgroundColor: cores.superficie, borderColor: cores.borda },
                    selecionado && { backgroundColor: cores.sucesso }, indisponivel && styles.horaIndisponivel]}
            >
                <View style={styles.horaConteudo}>
                    <Text style={[styles.horaTexto, { color: selecionado ? '#FFFFFF' : cores.texto }, indisponivel && styles.textoIndisponivel]}>
                        {intervalo.ocupado ? `${horario} · Ocupado` : intervalo.incompleto ? `${horario} · Indisponível` : horario}
                    </Text>
                </View>
            </Pressable>
        )
    }

    return (
        <View style={styles.container}>
            <View>
                <Text style={[styles.horasTexto, { color: cores.texto }]}>Manhã</Text>
                <View style={styles.horasConteudo}>{manha.map(renderizarHorario)}</View>
            </View>
            <View>
                <Text style={[styles.horasTexto, { color: cores.texto }]}>Tarde & Noite</Text>
                <View style={styles.horasConteudo}>{tardeNoite.map(renderizarHorario)}</View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        gap: 30,
    },
    horasTexto: {
        color: '#e4e4e7',
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    horasConteudo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center',
    },
    horaConteudo: {
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
    },
    horaContainer: {
        borderWidth: 1,
        borderColor: '#27272a',
        padding: 10,
        borderRadius: 6,
        minWidth: 96,
    },
    horaIndisponivel: { opacity: 0.42, backgroundColor: '#475467' },
    horaTexto: { fontSize: 12, fontWeight: '700' },
    textoIndisponivel: { textDecorationLine: 'line-through' },
})
