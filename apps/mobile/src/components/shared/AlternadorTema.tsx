import useTema from '@/src/data/contexts/ContextoTema'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function AlternadorTema() {
    const { modo, cores, alternarTema } = useTema()
    const insets = useSafeAreaInsets()
    return <Pressable
        accessibilityRole="button"
        accessibilityLabel={modo === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
        onPress={alternarTema}
        style={[styles.botao, { top: insets.top + 8, backgroundColor: cores.superficie, borderColor: cores.borda }]}
    >
        <Ionicons name={modo === 'dark' ? 'sunny-outline' : 'moon-outline'} size={21} color={cores.destaque} />
    </Pressable>
}

const styles = StyleSheet.create({
    botao: { position: 'absolute', right: 14, zIndex: 1000, elevation: 10, width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
})
