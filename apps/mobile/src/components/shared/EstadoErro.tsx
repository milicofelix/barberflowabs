import { Pressable, StyleSheet, Text, View } from 'react-native'

interface EstadoErroProps {
    mensagem: string
    tentarNovamente?: () => void
}

export default function EstadoErro({ mensagem, tentarNovamente }: EstadoErroProps) {
    return (
        <View style={styles.container} accessibilityRole="alert">
            <Text style={styles.titulo}>Algo não saiu como esperado</Text>
            <Text style={styles.mensagem}>{mensagem}</Text>
            {tentarNovamente ? (
                <Pressable style={styles.botao} onPress={tentarNovamente}>
                    <Text style={styles.botaoTexto}>Tentar novamente</Text>
                </Pressable>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', gap: 8, padding: 20 },
    titulo: { color: '#fca5a5', fontSize: 17, fontWeight: '700', textAlign: 'center' },
    mensagem: { color: '#e4e4e7', fontSize: 14, lineHeight: 20, textAlign: 'center' },
    botao: { marginTop: 6, borderRadius: 6, borderWidth: 1, borderColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 10 },
    botaoTexto: { color: '#fca5a5', fontWeight: '700' },
})
