import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'

export default function useReducaoMovimentoTour() {
    // Sem animação enquanto a preferência do sistema ainda não foi consultada.
    const [reduzir, setReduzir] = useState(true)
    useEffect(() => {
        let ativo = true
        const inscricao = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzir)
        void AccessibilityInfo.isReduceMotionEnabled().then(valor => { if (ativo) setReduzir(valor) }).catch(() => undefined)
        return () => { ativo = false; inscricao.remove() }
    }, [])
    return reduzir
}
