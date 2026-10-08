import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

interface CarregandoProps {
    mensagem?: string
}

export default function Carregando({ mensagem = 'Carregando...' }: CarregandoProps) {
    return (
        <View style={styles.container} accessibilityRole="progressbar">
            <ActivityIndicator size="large" color="#29A7EA" />
            <Text style={styles.texto}>{mensagem}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 24,
        backgroundColor: '#09090b',
    },
    texto: { color: '#d4d4d8', fontSize: 16, textAlign: 'center' },
})
