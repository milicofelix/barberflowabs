import PerfilUsuario from '@/src/components/usuario/PerfilUsuario'
import useSessao from '@/src/data/hooks/useSessao'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AbasParamList, StackParamList } from '@/src/navigation/types'
import MarcaUniFlow from '@/src/components/shared/MarcaUniFlow'
import { perfilAdmin, perfilOperacional, resolverPerfil } from '@/src/data/auth/perfis'
import CabecalhoIdentidadeUnidade from '@/src/components/shared/CabecalhoIdentidadeUnidade'

type Props = BottomTabScreenProps<AbasParamList, 'Usuario'>

export default function Usuario({ navigation }: Props) {
    const { cores } = useTema()
    const { usuario, encerrarSessao } = useSessao()
    const operacional = perfilOperacional(resolverPerfil(usuario))

    async function logout() {
        await encerrarSessao()
    }
    const abrirCadastroEstabelecimento = () => navigation.getParent<NativeStackNavigationProp<StackParamList>>()?.navigate('OnboardingEstabelecimento')
    const ajudaTourMapa = !operacional && !perfilAdmin(resolverPerfil(usuario)) ? <Pressable accessibilityRole="button"
        onPress={() => navigation.navigate('Descobrir', { tourMapa: Date.now() })}
        style={{ minHeight: 48, margin: 18, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: cores.borda }}>
        <Text style={{ color: cores.texto, fontWeight: '700' }}>Ver tour do mapa novamente</Text>
    </Pressable> : null
    const demonstracaoTour = __DEV__ && !operacional && !perfilAdmin(resolverPerfil(usuario)) ? <Pressable accessibilityRole="button"
        onPress={() => navigation.getParent<NativeStackNavigationProp<StackParamList>>()?.navigate('TourMapaDemonstracao')}
        style={{ minHeight: 48, margin: 18, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: cores.borda }}>
        <Text style={{ color: cores.texto, fontWeight: '700' }}>Demonstração do tour (desenvolvimento)</Text>
    </Pressable> : null

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
                {ajudaTourMapa}
                {demonstracaoTour}
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: cores.fundo }]}>
            <ScrollView contentContainerStyle={operacional ? styles.conteudoOperacional : styles.conteudoUsuario} keyboardShouldPersistTaps="handled">
                {operacional ? <CabecalhoIdentidadeUnidade /> : null}
                <PerfilUsuario usuario={usuario!} logout={logout} cadastrarEstabelecimento={abrirCadastroEstabelecimento} />
                {ajudaTourMapa}
                {demonstracaoTour}
            </ScrollView>
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
    conteudoUsuario: { paddingTop: 15 },
    conteudoOperacional: { padding: 18, paddingBottom: 36 },
})
