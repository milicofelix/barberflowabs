import { AgendaUtils, DateUtils, Horarios } from '@barbabrutal/core'
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
    const { manha, tardeNoite } = props.horariosDisponiveis ?? AgendaUtils.horariosDoDia()
    const { horariosOcupados } = props
    const todosHorariosDisponiveis = [...manha, ...tardeNoite]
    const horaSelecionada = props.value.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    })
    const intervaloSelecionado = new Horarios(
        horaSelecionada,
        props.qtdeHorarios,
        horariosOcupados,
        todosHorariosDisponiveis
    )

    function renderizarHorario(horario: string) {
        const intervalo = new Horarios(
            horario,
            props.qtdeHorarios,
            horariosOcupados,
            todosHorariosDisponiveis
        )
        const horarioOcupado = horariosOcupados.includes(horario)
        const indisponivel = intervalo.ocupado || intervalo.incompleto
        const selecionado = intervaloSelecionado.completo
            && !intervaloSelecionado.ocupado
            && intervaloSelecionado.todos.includes(horario)

        return (
            <Pressable
                key={horario}
                disabled={indisponivel}
                accessibilityState={{ disabled: indisponivel, selected: selecionado }}
                accessibilityLabel={
                    selecionado
                        ? `${horario}, parte do período selecionado`
                        : indisponivel
                            ? `${horario}, horário indisponível`
                            : horario
                }
                onPress={function () {
                    if (indisponivel) return
                    props.onChange(DateUtils.aplicarHorario(props.value, horario))
                }}
                style={[styles.horaContainer, { backgroundColor: cores.superficie, borderColor: cores.borda },
                    indisponivel && styles.horaIndisponivel,
                    selecionado && { backgroundColor: cores.sucesso, opacity: 1 }]}
            >
                <View style={styles.horaConteudo}>
                    <Text style={[styles.horaTexto, { color: selecionado ? '#FFFFFF' : cores.texto }, indisponivel && !selecionado && styles.textoIndisponivel]}>
                        {selecionado
                            ? horario
                            : horarioOcupado
                                ? `${horario} · Ocupado`
                                : indisponivel
                                    ? `${horario} · Indisponível`
                                    : horario}
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
