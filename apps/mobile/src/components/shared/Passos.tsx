import { StyleSheet, Text, Pressable, View } from 'react-native'
import React, { useState } from 'react'

export interface PassosProps {
    labels: string[]
    children: any
    permiteProximoPasso?: boolean[]
    labelAcao?: string
    acao?: () => void
}

export default function Passos(props: PassosProps) {
    const [passoAtual, setPassoAtual] = useState(0)

    function semPassoAnterior() {
        return passoAtual === 0
    }

    function passoAnterior() {
        if (semPassoAnterior()) return
        setPassoAtual(passoAtual - 1)
    }

    function semProximoPasso() {
        return passoAtual === props.labels.length - 1
    }

    function proximoPasso() {
        if (semProximoPasso()) return
        setPassoAtual(passoAtual + 1)
    }

    function renderizarLabels() {
        return (
            <View style={styles.passoContainer}>
                {props.labels.map((label, i) => (
                    <View key={label} style={styles.passo}>
                        <View
                            style={{
                                ...styles.passoNumero,
                                backgroundColor: i <= passoAtual ? '#e4e4e7' : '#71717a',
                            }}
                        >
                            <Text>{i + 1}</Text>
                        </View>
                        <Text
                            style={{
                                ...styles.passoTexto,
                                color: i <= passoAtual ? 'white' : '#3f3f46',
                            }}
                        >
                            {label}
                        </Text>
                    </View>
                ))}
            </View>
        )
    }

    function renderizarBotao(texto: string, desabilitar: boolean, onPress: () => void, destaque: boolean = false) {
        return (
            <View style={styles.botaoContainer}>
                <Pressable
                    disabled={desabilitar}
                    onPress={onPress}
                    style={{
                        borderRadius: 5,
                    }}
                >
                    <View
                        style={{
                            ...styles.botao,
                            backgroundColor: desabilitar ? '#18181b' : destaque ? '#EAB308' : '#27272a',
                        }}
                    >
                        <Text
                            style={{
                                ...styles.botaoTexto,
                                color: desabilitar ? '#3f3f46' : destaque ? 'black' : 'white',
                            }}
                        >
                            {texto}
                        </Text>
                    </View>
                </Pressable>
            </View>
        )
    }

    const permiteProximoPasso = props.permiteProximoPasso?.[passoAtual] ?? true

    return (
        <View>
            {renderizarLabels()}
            <View>{props.children?.[passoAtual]}</View>
            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
                {renderizarBotao('Anterior', semPassoAnterior(), passoAnterior)}
                {props.acao && semProximoPasso()
                    ? renderizarBotao(props.labelAcao ?? 'Finalizar', !permiteProximoPasso, props.acao, true)
                    : renderizarBotao('Próximo', semProximoPasso() || !permiteProximoPasso, proximoPasso)}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    passoContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    passoNumero: {
        borderRadius: 999,
        width: 20,
        height: 20,
        color: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    passoTexto: {
        fontSize: 18,
    },
    passo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    botaoContainer: {
        marginTop: 10,
        justifyContent: 'center',
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    botao: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 5,
    },
    botaoTexto: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '700',
    },
})
