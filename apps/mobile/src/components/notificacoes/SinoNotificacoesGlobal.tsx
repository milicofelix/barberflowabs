import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useSessao from '@/src/data/hooks/useSessao'
import SinoNotificacoes from './SinoNotificacoes'

export default function SinoNotificacoesGlobal() {
    const { usuario } = useSessao()
    const insets = useSafeAreaInsets()

    if (!usuario) return null

    return <View style={[styles.container, { top: insets.top + 8 }]}><SinoNotificacoes /></View>
}

const styles = StyleSheet.create({
    // O tema ocupa o canto direito; o sino permanece ao lado em toda área autenticada.
    container: { position: 'absolute', right: 64, zIndex: 1000, elevation: 10 },
})
