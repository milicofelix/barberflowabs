import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AssistenteEstabelecimento from '@/src/components/onboarding/AssistenteEstabelecimento'
import MarcaUniFlow from '@/src/components/shared/MarcaUniFlow'
import useSessao from '@/src/data/hooks/useSessao'
import useTema from '@/src/data/contexts/ContextoTema'
import type { StackParamList } from '@/src/navigation/types'

type Props = NativeStackScreenProps<StackParamList, 'OnboardingEstabelecimento'>

export default function OnboardingEstabelecimento({ navigation }: Props) {
    const { usuario } = useSessao()
    const { cores } = useTema()
    return <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]} edges={['bottom']}>
        <View style={styles.marca}><MarcaUniFlow compacta /></View>
        {usuario ? <AssistenteEstabelecimento /> : <View style={styles.entrada}>
            <View style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                <Text style={[styles.titulo, { color: cores.texto }]}>Primeiro, acesse sua conta</Text>
                <Text style={[styles.descricao, { color: cores.textoSecundario }]}>Toda pessoa começa como cliente. Depois do acesso, você retornará ao cadastro do estabelecimento sem duplicar seus dados.</Text>
                <Pressable style={styles.botao} onPress={() => navigation.navigate('Autenticacao', { destino: 'OnboardingEstabelecimento' })}>
                    <Text style={styles.botaoTexto}>Entrar ou criar conta</Text>
                </Pressable>
                <Text style={[styles.rodape, { color: cores.textoSecundario }]}>O acesso operacional será liberado somente após a aprovação.</Text>
            </View>
        </View>}
    </SafeAreaView>
}

const styles = StyleSheet.create({
    tela: { flex: 1 }, marca: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 }, entrada: { flex: 1, justifyContent: 'center', padding: 18 },
    cartao: { borderWidth: 1, borderRadius: 22, padding: 24, alignItems: 'center' }, titulo: { fontSize: 25, fontWeight: '900', textAlign: 'center' },
    descricao: { marginTop: 10, fontSize: 14, lineHeight: 21, textAlign: 'center' }, botao: { marginTop: 22, minHeight: 50, borderRadius: 13, backgroundColor: '#6D28D9', paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
    botaoTexto: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, rodape: { marginTop: 16, fontSize: 12, textAlign: 'center' },
})
