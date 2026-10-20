import { useEffect, useRef, type PropsWithChildren } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { useTour } from './ContextoTour'

export default function AlvoTour({ chave, children, style }: PropsWithChildren<{ chave: string; style?: StyleProp<ViewStyle> }>) {
    const ref = useRef<View>(null)
    const { alvos } = useTour()
    useEffect(() => alvos.registrar(chave, resultado => {
        if (!ref.current) { resultado(null); return }
        ref.current.measureInWindow((x, y, largura, altura) => resultado({ x, y, largura, altura }))
    }), [alvos, chave])
    return <View ref={ref} collapsable={false} onLayout={alvos.invalidar} style={style}>{children}</View>
}
