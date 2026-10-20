import { forwardRef } from 'react'
import { TextInput } from 'react-native'
import CampoTexto, { CampoTextoProps } from './CampoTexto'

const CampoEmail = forwardRef<TextInput, CampoTextoProps>(function CampoEmail(props, ref) {
    return (
        <CampoTexto
            {...props}
            ref={ref}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
        />
    )
})

export default CampoEmail
