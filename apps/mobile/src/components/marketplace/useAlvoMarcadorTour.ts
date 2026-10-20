import { useEffect, useRef, type RefObject } from 'react'
import { View } from 'react-native'
import MapView from 'react-native-maps'
import { useTour } from '@/src/components/tour/ContextoTour'
import type { EstabelecimentoResumo } from '@/src/data/estabelecimentos/tipos'
import { retanguloMarcadorMapa } from '@/src/data/tour/pontos-mapa'

/** Projeta um marcador existente na câmera atual. Nunca move ou ajusta a câmera. */
export default function useAlvoMarcadorTour(mapa: RefObject<MapView | null>, container: RefObject<View | null>, viewport: RefObject<View | null>, pontos: EstabelecimentoResumo[], pronto: boolean, selecionadoId?: number) {
    const { alvos } = useTour()
    const atual = useRef({ pontos, pronto, selecionadoId }); atual.current = { pontos, pronto, selecionadoId }
    useEffect(() => alvos.registrar('descoberta.marcadores', resultado => {
        if (!atual.current.pronto || !mapa.current || !container.current) { resultado(null); return }
        const instancia = mapa.current
        container.current.measureInWindow((x, y, largura, altura) => {
            void (async () => {
                const visivel = await new Promise<{ x: number; y: number; largura: number; altura: number } | null>(resolve => {
                    if (!viewport.current) { resolve(null); return }
                    viewport.current.measureInWindow((x, y, largura, altura) => resolve({ x, y, largura, altura }))
                })
                if (!visivel) { resultado(null); return }
                const selecionado = atual.current.pontos.find(p => p.id === atual.current.selecionadoId)
                const candidatos = selecionado ? [selecionado, ...atual.current.pontos.filter(p => p.id !== selecionado.id)] : atual.current.pontos
                for (const ponto of candidatos) {
                    const posicao = await instancia.pointForCoordinate({ latitude: Number(ponto.endereco.latitude), longitude: Number(ponto.endereco.longitude) })
                    const retangulo = retanguloMarcadorMapa(posicao, largura, altura)
                    if (retangulo) {
                        const absoluto = { ...retangulo, x: x + retangulo.x, y: y + retangulo.y }
                        if (absoluto.x < visivel.x || absoluto.y < visivel.y || absoluto.x + absoluto.largura > visivel.x + visivel.largura || absoluto.y + absoluto.altura > visivel.y + visivel.altura) continue
                        resultado(absoluto); return
                    }
                }
                resultado(null)
            })().catch(() => resultado(null))
        })
    }), [alvos, container, mapa, viewport])
    useEffect(() => { alvos.invalidar() }, [alvos, pontos, pronto, selecionadoId])
    return alvos.invalidar
}
