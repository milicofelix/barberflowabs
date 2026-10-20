import { Ionicons } from '@expo/vector-icons'
import { forwardRef, useState } from 'react'
import { Pressable, TextInput } from 'react-native'
import CampoTexto, { CampoTextoProps } from './CampoTexto'

const CampoSenha = forwardRef<TextInput, CampoTextoProps>(function CampoSenha(props, ref) {
    const [visivel, setVisivel] = useState(false)

    return (
        <CampoTexto
            {...props}
            ref={ref}
            secureTextEntry={!visivel}
            autoCapitalize="none"
            autoCorrect={false}
            acaoDireita={
                <Pressable
                    onPress={() => setVisivel((valor) => !valor)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'}
                >
                    <Ionicons name={visivel ? 'eye-off-outline' : 'eye-outline'} size={22} color="#526078" />
                </Pressable>
            }
        />
    )
})

export default CampoSenha
