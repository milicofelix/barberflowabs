import { forwardRef, ReactNode } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

export interface CampoTextoProps extends Omit<TextInputProps, 'style' | 'onChangeText' | 'value'> {
    label: string
    value: string
    error?: string
    onChangeText: (s: string) => void
    acaoDireita?: ReactNode
}

const CampoTexto = forwardRef<TextInput, CampoTextoProps>(function CampoTexto(
    { label, error, acaoDireita, ...inputProps },
    ref
) {
    const { cores } = useTema()
    return (
        <View style={styles.campo}>
            <Text style={[styles.label, { color: cores.texto }]}>{label}</Text>
            <View style={[styles.inputContainer, { backgroundColor: cores.campo, borderColor: cores.borda }, error ? styles.inputError : null]}>
                <TextInput
                    {...inputProps}
                    ref={ref}
                    style={[styles.input, { color: cores.campoTexto }]}
                    placeholderTextColor={cores.textoSecundario}
                    accessibilityLabel={label}
                />
                {acaoDireita ? <View style={styles.acaoDireita}>{acaoDireita}</View> : null}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    )
})

export default CampoTexto

export const styles = StyleSheet.create({
    campo: { width: '100%', marginBottom: 16 },
    label: {
        color: '#172033',
        marginBottom: 7,
        fontSize: 14,
        fontWeight: '700',
    },
    inputContainer: {
        width: '100%',
        minHeight: 50,
        backgroundColor: '#F7F8FA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D8DEE8',
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        minHeight: 48,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#111827',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#DC2626',
        backgroundColor: '#FEF2F2',
    },
    errorText: {
        color: '#B91C1C',
        marginTop: 6,
        fontSize: 13,
    },
    acaoDireita: { paddingRight: 8 },
})
