import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

interface ConfirmacaoProps {
    visivel: boolean
    titulo: string
    mensagem: string
    confirmarLabel?: string
    cancelarLabel?: string
    onConfirmar: () => void
    onCancelar: () => void
}

export default function Confirmacao(props: ConfirmacaoProps) {
    const { cores } = useTema()
    return (
        <Modal transparent animationType="fade" visible={props.visivel} onRequestClose={props.onCancelar}>
            <View style={[styles.fundo, { backgroundColor: cores.sobreposicao }]}>
                <View style={[styles.card, { backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1 }]}>
                    <Text style={[styles.titulo, { color: cores.texto }]}>{props.titulo}</Text>
                    <Text style={[styles.mensagem, { color: cores.textoSecundario }]}>{props.mensagem}</Text>
                    <View style={styles.acoes}>
                        <Pressable style={[styles.cancelar, { borderColor: cores.borda }]} onPress={props.onCancelar}>
                            <Text style={[styles.cancelarTexto, { color: cores.texto }]}>{props.cancelarLabel ?? 'Cancelar'}</Text>
                        </Pressable>
                        <Pressable style={[styles.confirmar, { backgroundColor: cores.destaque }]} onPress={props.onConfirmar}>
                            <Text style={[styles.confirmarTexto, { color: cores.destaqueTexto }]}>{props.confirmarLabel ?? 'Confirmar'}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    fundo: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.75)' },
    card: { width: '100%', maxWidth: 420, gap: 14, borderRadius: 10, backgroundColor: '#18181b', padding: 22 },
    titulo: { color: '#fff', fontSize: 20, fontWeight: '700' },
    mensagem: { color: '#d4d4d8', fontSize: 15, lineHeight: 22 },
    acoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
    cancelar: { borderRadius: 6, borderWidth: 1, borderColor: '#52525b', paddingHorizontal: 14, paddingVertical: 10 },
    cancelarTexto: { color: '#e4e4e7', fontWeight: '700' },
    confirmar: { borderRadius: 6, backgroundColor: '#29A7EA', paddingHorizontal: 14, paddingVertical: 10 },
    confirmarTexto: { color: '#fff', fontWeight: '700' },
})
