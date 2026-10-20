import { StyleSheet, Text, View } from 'react-native'

interface FeedbackSucessoProps {
    mensagem: string
}

export default function FeedbackSucesso({ mensagem }: FeedbackSucessoProps) {
    return (
        <View style={styles.container} accessibilityRole="alert">
            <Text style={styles.icone}>✓</Text>
            <Text style={styles.mensagem}>{mensagem}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 7, backgroundColor: '#14532d', padding: 14 },
    icone: { color: '#bbf7d0', fontSize: 20, fontWeight: '800' },
    mensagem: { flex: 1, color: '#dcfce7', fontSize: 14, fontWeight: '600' },
})
