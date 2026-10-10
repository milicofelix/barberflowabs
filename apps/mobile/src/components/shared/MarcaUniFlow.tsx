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
                <Text style={[compacta ? styles.absCompacto : styles.abs, { color: cores.textoSecundario }]}>ABS</Text>
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
    nomeLinha: { alignItems: 'baseline', flexDirection: 'row', marginTop: -8 },
    nome: { fontSize: 34, fontWeight: '900', letterSpacing: -1.2 },
    nomeCompacto: { fontSize: 24, fontWeight: '900', letterSpacing: -0.8 },
    flow: { color: '#7C5CFC' },
    abs: { fontSize: 14, fontWeight: '800', letterSpacing: 4, marginLeft: 8 },
    absCompacto: { fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginLeft: 6 },
    slogan: { fontSize: 9, fontWeight: '700', letterSpacing: 1.25, marginTop: 7 },
})
