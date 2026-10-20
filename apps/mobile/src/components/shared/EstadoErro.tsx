import { Pressable, StyleSheet, Text, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

interface EstadoErroProps {
    mensagem: string
    tentarNovamente?: () => void
}

export default function EstadoErro({ mensagem, tentarNovamente }: EstadoErroProps) {
    const { cores } = useTema()
    return (
        <View style={styles.container} accessibilityRole="alert">
            <Text style={[styles.titulo, { color: cores.perigo }]}>Algo não saiu como esperado</Text>
            <Text style={[styles.mensagem, { color: cores.texto }]}>{mensagem}</Text>
            {tentarNovamente ? (
                <Pressable style={[styles.botao, { borderColor: cores.perigo }]} onPress={tentarNovamente}>
                    <Text style={[styles.botaoTexto, { color: cores.perigo }]}>Tentar novamente</Text>
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
