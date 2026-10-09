import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

interface CarregandoProps {
    mensagem?: string
}

export default function Carregando({ mensagem = 'Carregando...' }: CarregandoProps) {
    const { cores } = useTema()
    return (
        <View style={[styles.container, { backgroundColor: cores.fundo }]} accessibilityRole="progressbar">
            <ActivityIndicator size="large" color={cores.destaque} />
            <Text style={[styles.texto, { color: cores.textoSecundario }]}>{mensagem}</Text>
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
