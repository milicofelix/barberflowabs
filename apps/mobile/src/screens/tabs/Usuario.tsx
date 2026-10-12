import PerfilUsuario from '@/src/components/usuario/PerfilUsuario'
import useSessao from '@/src/data/hooks/useSessao'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AbasParamList, StackParamList } from '@/src/navigation/types'
import MarcaUniFlow from '@/src/components/shared/MarcaUniFlow'

type Props = BottomTabScreenProps<AbasParamList, 'Usuario'>

export default function Usuario({ navigation }: Props) {
    const { cores } = useTema()
    const { usuario, encerrarSessao } = useSessao()

    async function logout() {
        await encerrarSessao()
    }
    const abrirCadastroEstabelecimento = () => navigation.getParent<NativeStackNavigationProp<StackParamList>>()?.navigate('OnboardingEstabelecimento')

    if (!usuario) {
        const entrar = () => navigation.getParent<NativeStackNavigationProp<StackParamList>>()?.navigate('Autenticacao')
        return (
            <SafeAreaView style={[styles.container, styles.visitante, { backgroundColor: cores.fundo }]}>
                <MarcaUniFlow compacta />
                <Text style={[styles.titulo, { color: cores.texto }]}>Sua conta UniFlow ABS</Text>
                <Text style={[styles.descricao, { color: cores.textoSecundario }]}>Entre ou crie uma conta para agendar e acompanhar seus horários.</Text>
                <Pressable onPress={entrar} style={[styles.entrar, { backgroundColor: cores.destaque }]}>
                    <Text style={[styles.entrarTexto, { color: cores.destaqueTexto }]}>Entrar ou criar conta</Text>
                </Pressable>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: cores.fundo }]}>
            <View style={{ flex: 1, paddingTop: 15 }}>
                <PerfilUsuario usuario={usuario!} logout={logout} cadastrarEstabelecimento={abrirCadastroEstabelecimento} />
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    visitante: { justifyContent: 'center', alignItems: 'center', padding: 28 },
    titulo: { marginTop: 24, fontSize: 25, fontWeight: '900', textAlign: 'center' },
    descricao: { maxWidth: 340, marginTop: 10, fontSize: 15, lineHeight: 22, textAlign: 'center' },
    entrar: { minHeight: 50, marginTop: 24, paddingHorizontal: 24, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    entrarTexto: { fontSize: 15, fontWeight: '900' },
})
