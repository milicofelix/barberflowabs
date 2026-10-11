import useTema from '@/src/data/contexts/ContextoTema'
import { Image, StyleSheet, Text, View } from 'react-native'

interface MarcaUniFlowProps {
    compacta?: boolean
    exibirSlogan?: boolean
    horizontal?: boolean
    contraste?: boolean
}

export default function MarcaUniFlow({ compacta = false, exibirSlogan = true, horizontal = false, contraste = false }: MarcaUniFlowProps) {
    const { cores } = useTema()
    const estiloNome = horizontal ? styles.nomeHorizontal : compacta ? styles.nomeCompacto : styles.nome
    const estiloEmblema = horizontal ? styles.emblemaHorizontal : compacta ? styles.emblemaCompacto : styles.emblema
    const estiloCapsula = horizontal ? styles.absCapsulaHorizontal : compacta ? styles.absCapsulaCompacta : styles.absCapsula
    const estiloAbs = horizontal ? styles.absTextoHorizontal : compacta ? styles.absTextoCompacto : styles.absTexto
    const corTexto = contraste ? '#FFFFFF' : cores.texto

    return (
        <View style={[styles.container, horizontal && styles.containerHorizontal]} accessibilityRole="header" accessibilityLabel="UniFlow ABS">
            <Image
                source={require('@/assets/images/brand/logo-mark-transparent.png')}
                style={estiloEmblema}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
            />
            <View style={horizontal && styles.textosHorizontal}>
                <View style={[styles.nomeLinha, horizontal && styles.nomeLinhaHorizontal]}>
                    <Text style={[estiloNome, { color: corTexto }]}>Uni</Text>
                    <Text style={[estiloNome, styles.flow]}>Flow</Text>
                    <View style={[estiloCapsula, { backgroundColor: contraste ? '#101827' : cores.superficie }]}>
                        <Text style={[estiloAbs, { color: corTexto }]}>ABS</Text>
                    </View>
                </View>
                {exibirSlogan && !compacta ? (
                    <Text style={[styles.slogan, horizontal && styles.sloganHorizontal, { color: contraste ? '#E2E8F0' : cores.textoSecundario }]}>TODOS OS SERVIÇOS. UMA SÓ PLATAFORMA.</Text>
                ) : null}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    containerHorizontal: { flexDirection: 'row', justifyContent: 'flex-start' },
    textosHorizontal: { flexShrink: 1 },
    emblema: { width: 156, height: 156 },
    emblemaCompacto: { width: 88, height: 88 },
    emblemaHorizontal: { width: 68, height: 68, marginRight: 7 },
    nomeLinha: { alignItems: 'center', flexDirection: 'row', marginTop: -8 },
    nomeLinhaHorizontal: { marginTop: 0 },
    nome: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
    nomeCompacto: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
    nomeHorizontal: { fontSize: 25, fontWeight: '900', letterSpacing: -0.9 },
    flow: { color: '#7C5CFC' },
    absCapsula: { marginLeft: 10, paddingHorizontal: 13, paddingVertical: 4, borderWidth: 2, borderLeftColor: '#00D4FF', borderTopColor: '#60A5FA', borderRightColor: '#E879F9', borderBottomColor: '#A78BFA', borderRadius: 12, shadowColor: '#7C3AED', shadowOpacity: 0.2, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
    absCapsulaCompacta: { marginLeft: 7, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 2, borderLeftColor: '#00D4FF', borderTopColor: '#60A5FA', borderRightColor: '#E879F9', borderBottomColor: '#A78BFA', borderRadius: 9, shadowColor: '#7C3AED', shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
    absCapsulaHorizontal: { marginLeft: 7, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 2, borderLeftColor: '#00D4FF', borderTopColor: '#60A5FA', borderRightColor: '#E879F9', borderBottomColor: '#A78BFA', borderRadius: 9, shadowColor: '#7C3AED', shadowOpacity: 0.2, shadowRadius: 7, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
    absTexto: { fontSize: 14, fontWeight: '900', letterSpacing: 0.7, lineHeight: 18 },
    absTextoCompacto: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, lineHeight: 13 },
    absTextoHorizontal: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, lineHeight: 13 },
    slogan: { fontSize: 9, fontWeight: '700', letterSpacing: 1.25, marginTop: 7 },
    sloganHorizontal: { fontSize: 7, letterSpacing: 0.75, marginTop: 3 },
})
