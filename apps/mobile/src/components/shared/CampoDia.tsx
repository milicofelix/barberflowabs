import { DateUtils } from '@uniflowabs/core'
import { StyleSheet, Text, Pressable, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

export interface CampoDiaProps {
    value: Date
    onChange(data: Date): void
}

export default function CampoDia(props: CampoDiaProps) {
    const { cores } = useTema()
    function renderizarDia(data: Date) {
        if (data.getDay() === 0) {
            data.setDate(data.getDate() + 1)
        }

        const selecionado = data.getDate() === props.value.getDate()
        return (
            <View key={data.getTime()} style={[styles.card, { backgroundColor: selecionado ? cores.destaque : cores.superficie }]}>
                <Pressable onPress={() => props.onChange(data)}>
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text
                                style={{
                                    ...styles.mesNumero,
                                    color: selecionado ? cores.destaqueTexto : cores.texto,
                                }}
                            >
                                {data.getDate()}
                            </Text>
                            <Text
                                style={{
                                    ...styles.mesTexto,
                                    color: selecionado ? cores.destaqueTexto : cores.texto,
                                }}
                            >
                                {data.toLocaleDateString('pt-BR', { month: 'short' }).slice(0, 3)}
                            </Text>
                        </View>
                        <Text
                            style={{
                                color: selecionado ? cores.destaqueTexto : cores.texto,
                                textTransform: 'uppercase',
                            }}
                        >
                            {data.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                        </Text>
                    </View>
                </Pressable>
            </View>
        )
    }

    return (
        <View style={{ marginTop: 30, alignItems: 'center' }}>
            <Text style={{ color: cores.texto, fontSize: 18, fontWeight: 'bold' }}>Dias Disponíveis</Text>
            <View style={styles.diaContainer}>
                {DateUtils.proximosDias(7)
                    .filter((date) => date.getDay() !== 0)
                    .map((date) => renderizarDia(date))}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    diaContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        marginVertical: 16,
        flexWrap: 'wrap',
        borderRadius: 10,
        overflow: 'hidden',
    },
    mesNumero: { fontSize: 20, fontWeight: '800', color: '#e4e4e7' },
    mesTexto: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        color: '#e4e4e7',
    },
    card: {
        flex: 1,
        paddingVertical: 10,
    },
})
