import PerfilUsuario from '@/src/components/usuario/PerfilUsuario'
import useSessao from '@/src/data/hooks/useSessao'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'

export default function Usuario() {
    const { cores } = useTema()
    const { usuario, encerrarSessao } = useSessao()

    async function logout() {
        await encerrarSessao()
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: cores.fundo }]}>
            <View style={{ flex: 1, paddingTop: 15 }}>
                <PerfilUsuario usuario={usuario!} logout={logout} />
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
})
