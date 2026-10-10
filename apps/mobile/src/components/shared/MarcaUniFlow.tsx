import useTema from '@/src/data/contexts/ContextoTema'
import { Image, StyleSheet, Text, View } from 'react-native'

interface MarcaUniFlowProps {
    compacta?: boolean
    exibirSlogan?: boolean
}

export default function MarcaUniFlow({ compacta = false, exibirSlogan = true }: MarcaUniFlowProps) {
    const { cores } = useTema()

    return (
        <View style={styles.container} accessibilityRole="header" accessibilityLabel="UniFlow ABS">
            <Image
                source={require('@/assets/images/brand/logo-mark-transparent.png')}
                style={compacta ? styles.emblemaCompacto : styles.emblema}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
            />
            <View style={styles.nomeLinha}>
                <Text style={[compacta ? styles.nomeCompacto : styles.nome, { color: cores.texto }]}>Uni</Text>
                <Text style={[compacta ? styles.nomeCompacto : styles.nome, styles.flow]}>Flow</Text>
                <View style={[compacta ? styles.absCapsulaCompacta : styles.absCapsula, { backgroundColor: cores.superficie }]}>
                    <Text style={[compacta ? styles.absTextoCompacto : styles.absTexto, { color: cores.texto }]}>ABS</Text>
                </View>
            </View>
            {exibirSlogan && !compacta ? (
                <Text style={[styles.slogan, { color: cores.textoSecundario }]}>TODOS OS SERVIÇOS. UMA SÓ PLATAFORMA.</Text>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    emblema: { width: 156, height: 156 },
    emblemaCompacto: { width: 88, height: 88 },
    nomeLinha: { alignItems: 'center', flexDirection: 'row', marginTop: -8 },
    nome: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
    nomeCompacto: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
    flow: { color: '#7C5CFC' },
    absCapsula: { marginLeft: 10, paddingHorizontal: 13, paddingVertical: 4, borderWidth: 2, borderLeftColor: '#00D4FF', borderTopColor: '#60A5FA', borderRightColor: '#E879F9', borderBottomColor: '#A78BFA', borderRadius: 12, shadowColor: '#7C3AED', shadowOpacity: 0.2, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
    absCapsulaCompacta: { marginLeft: 7, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 2, borderLeftColor: '#00D4FF', borderTopColor: '#60A5FA', borderRightColor: '#E879F9', borderBottomColor: '#A78BFA', borderRadius: 9, shadowColor: '#7C3AED', shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
    absTexto: { fontSize: 14, fontWeight: '900', letterSpacing: 0.7, lineHeight: 18 },
    absTextoCompacto: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, lineHeight: 13 },
    slogan: { fontSize: 9, fontWeight: '700', letterSpacing: 1.25, marginTop: 7 },
})
