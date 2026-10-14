import AgendamentosUsuario from '@/src/components/agendamento/AgendamentosUsuario'
import useTema from '@/src/data/contexts/ContextoTema'
import { View, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useSessao from '@/src/data/hooks/useSessao'
import { perfilOperacional, resolverPerfil } from '@/src/data/auth/perfis'
import ProximosAgendamentos from '@/src/components/operacao/ProximosAgendamentos'
import CabecalhoIdentidadeUnidade from '@/src/components/shared/CabecalhoIdentidadeUnidade'

export default function Inicio() {
    const { modo } = useTema()
    const { usuario } = useSessao()
    const operacional = perfilOperacional(resolverPerfil(usuario))
    if (operacional) {
        return <SafeAreaView style={[styles.container, { backgroundColor: modo === 'light' ? '#FFFFFF' : '#081426' }]} edges={['top']}>
            {modo === 'light' ? <DecoracaoClara /> : null}
            <ProximosAgendamentos cabecalho={<CabecalhoIdentidadeUnidade destaque />} />
        </SafeAreaView>
    }

    const conteudo = <SafeAreaView style={[styles.container, modo === 'light' && styles.containerClaro]}>
        {modo === 'light' ? <DecoracaoClara /> : null}
        <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.conteudo}>
                <AgendamentosUsuario />
            </View>
        </ScrollView>
    </SafeAreaView>

    return <View style={[styles.fundoClaro, { backgroundColor: modo === 'light' ? '#FFFFFF' : '#081426' }]}>
        {modo === 'dark' ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#081426' }]} /> : null}
        {conteudo}
    </View>
}

function DecoracaoClara() {
    return <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
        <View style={[styles.orbe, styles.orbeAzul]} />
        <View style={[styles.orbe, styles.orbeVioleta]} />
        <View style={styles.faixaGradiente} />
    </View>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: 'transparent',
    },
    containerClaro: { backgroundColor: '#FFFFFF' },
    fundoClaro: { flex: 1, backgroundColor: '#FFFFFF' },
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
    orbe: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
    orbeAzul: { width: 260, height: 260, top: -90, left: -100, backgroundColor: '#00D4FF' },
    orbeVioleta: { width: 300, height: 300, right: -150, top: 150, backgroundColor: '#A855F7' },
    faixaGradiente: { position: 'absolute', left: 28, right: 28, top: 122, height: 2, borderRadius: 2, backgroundColor: '#6366F1', opacity: 0.2 },
})
