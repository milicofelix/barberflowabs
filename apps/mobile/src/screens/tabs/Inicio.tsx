import AgendamentosUsuario from '@/src/components/agendamento/AgendamentosUsuario'
import { View, ImageBackground, SafeAreaView, ScrollView, StyleSheet } from 'react-native'

export default function Inicio() {
    return (
        <ImageBackground
            source={require('@/assets/images/inicio/fundo.png')}
            style={styles.imagemDeFundo}
        >
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.conteudo}>
                        <AgendamentosUsuario />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: 'transparent',
    },
    scroll: {
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    conteudo: {
        width: '100%',
        justifyContent: 'flex-start',
    },
    imagemDeFundo: {
        flex: 1,
        resizeMode: 'cover',
        width: '100%',
        height: '100%',
    },
})
