import { useEffect, useState, useSyncExternalStore } from 'react'
import { alvoVisivelTour, type RegistroAlvosTour, type RetanguloAlvoTour } from '@/src/data/tour/alvos'

export default function useMedidaAlvoTour(registro: RegistroAlvosTour, chave: string, ativo: boolean, viewport: RetanguloAlvoTour | null) {
    const revisao = useSyncExternalStore(registro.observar, registro.obterRevisao, registro.obterRevisao)
    const [resultado, setResultado] = useState<{ chave: string; revisao: number; viewport: RetanguloAlvoTour | null; alvo: RetanguloAlvoTour | null } | null>(null)
    useEffect(() => {
        if (!ativo || !viewport) return
        let cancelado = false
        const publicar = (alvo: RetanguloAlvoTour | null) => {
            if (!cancelado) setResultado({ chave, revisao, viewport, alvo: alvoVisivelTour(alvo, viewport) })
        }
        // Medida nativa pode não responder durante desmontagem/rotação: nunca travar o cartão.
        const limite = setTimeout(() => publicar(null), 500)
        const frame = requestAnimationFrame(() => registro.medir(chave, alvo => { clearTimeout(limite); publicar(alvo) }))
        return () => { cancelado = true; clearTimeout(limite); cancelAnimationFrame(frame) }
    }, [ativo, chave, registro, revisao, viewport])
    if (!ativo || resultado?.chave !== chave || resultado.revisao !== revisao || resultado.viewport !== viewport) return { alvo: null, concluida: false }
    return { alvo: resultado.alvo, concluida: true }
}
