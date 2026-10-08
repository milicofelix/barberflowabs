import { Pressable, StyleSheet, Text, View } from 'react-native'

interface EstadoVazioProps {
    titulo: string
    descricao?: string
    acaoLabel?: string
    onAcao?: () => void
}

export default function EstadoVazio({ titulo, descricao, acaoLabel, onAcao }: EstadoVazioProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>{titulo}</Text>
            {descricao ? <Text style={styles.descricao}>{descricao}</Text> : null}
            {acaoLabel && onAcao ? (
                <Pressable style={styles.botao} onPress={onAcao}>
                    <Text style={styles.botaoTexto}>{acaoLabel}</Text>
                </Pressable>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
    titulo: { color: '#fafafa', fontSize: 20, fontWeight: '700', textAlign: 'center' },
    descricao: { color: '#a1a1aa', fontSize: 15, lineHeight: 22, textAlign: 'center' },
    botao: { marginTop: 8, borderRadius: 6, backgroundColor: '#29A7EA', paddingHorizontal: 18, paddingVertical: 12 },
    botaoTexto: { color: '#fff', fontWeight: '700' },
})
