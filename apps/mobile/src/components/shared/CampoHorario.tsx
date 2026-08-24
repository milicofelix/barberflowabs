import { AgendaUtils, DateUtils, Horarios } from '@barbabrutal/core'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface CampoHorarioProps {
    value: Date
    qtdeHorarios: number
    horariosOcupados: string[]
    onChange(data: Date): void
}

export default function CampoHorario(props: CampoHorarioProps) {
    const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null)
    const { manha, tardeNoite } = AgendaUtils.horariosDoDia()
    const { horariosOcupados } = props

    const dia = props.value.toISOString().slice(0, 10) ?? ''

    useEffect(() => {
        const horarioAtual = props.value.toLocaleString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        })
        setHoraSelecionada(horarioAtual)
    }, [dia])

    function renderizarHorario(horario: string) {
        const horariosSelecionados = new Horarios(
            horaSelecionada!,
            props.qtdeHorarios,
            horariosOcupados
        )
        const selecionado = horariosSelecionados.todos.includes(horario)

        const corBotao = () => {
            if (selecionado) {
                return horariosSelecionados.ocupado || horariosSelecionados.incompleto
                    ? '#ef4444'
                    : '#16a34a'
            } else {
                return '#18181b'
            }
        }

        return (
            <Pressable
                key={horario}
                onPress={function () {
                    setHoraSelecionada(horario)
                    const horarios = new Horarios(horario!, props.qtdeHorarios, horariosOcupados)

                    if (horarios.ocupado || horarios.incompleto) {
                        props.onChange(DateUtils.aplicarHorario(props.value, '00:00'))
                    } else {
                        props.onChange(DateUtils.aplicarHorario(props.value, horario))
                    }
                }}
                style={{
                    ...styles.horaContainer,
                    backgroundColor: corBotao(),
                }}
            >
                <View style={styles.horaConteudo}>
                    <Text style={{ color: '#e4e4e7' }}>
                        {horariosOcupados.includes(horario) ? 'X' : horario}
                    </Text>
                </View>
            </Pressable>
        )
    }

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.horasTexto}>Manhã</Text>
                <View style={styles.horasConteudo}>{manha.map(renderizarHorario)}</View>
            </View>
            <View>
                <Text style={styles.horasTexto}>Tarde & Noite</Text>
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
        width: 90,
    },
})
