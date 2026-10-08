import { forwardRef, ReactNode } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'

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
    return (
        <View style={styles.campo}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.inputContainer, error ? styles.inputError : null]}>
                <TextInput
                    {...inputProps}
                    ref={ref}
                    style={styles.input}
                    placeholderTextColor="#78869A"
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
