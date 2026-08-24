import { KeyboardTypeOptions, StyleSheet, Text, TextInput } from 'react-native'

export interface CampoTextoProps {
    label: string
    value: string
    placeholder?: string
    error?: string
    keyboardType?: KeyboardTypeOptions
    secureTextEntry?: boolean
    onChangeText: (s: string) => void
}

export default function CampoTexto(props: CampoTextoProps) {
    return (
        <>
            <Text style={styles.label}>{props.label}</Text>
            <TextInput
                style={[styles.input, props.error ? styles.inputError : null]}
                placeholder={props.placeholder}
                placeholderTextColor="#666"
                value={props.value}
                onChangeText={props.onChangeText}
                keyboardType={props.keyboardType}
                secureTextEntry={props.secureTextEntry}
            />
            {props.error ? <Text style={styles.errorText}>{props.error}</Text> : null}
        </>
    )
}

export const styles = StyleSheet.create({
    label: {
        color: '#fff',
        alignSelf: 'flex-start',
        marginBottom: 8,
        marginLeft: 10,
        fontSize: 16,
    },
    input: {
        width: '100%',
        minWidth: 280,
        height: 40,
        backgroundColor: '#1e1e1e',
        borderRadius: 5,
        paddingHorizontal: 10,
        color: '#fff',
        marginBottom: 20,
    },
    inputError: {
        borderColor: 'red',
        borderWidth: 1,
    },
    errorText: {
        color: 'red',
        marginBottom: 20,
        marginLeft: 10,
        alignSelf: 'flex-start',
    },
})
