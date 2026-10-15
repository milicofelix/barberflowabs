import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'
import { type RetanguloAlvoTour } from '@/src/data/tour/alvos'
import { useTour } from './ContextoTour'
import useMedidaAlvoTour from './useMedidaAlvoTour'
import useReducaoMovimentoTour from './useReducaoMovimentoTour'

export default function SobreposicaoTour() {
    const { controlador, alvos, estado, aberto, erro } = useTour()
    const { cores } = useTema()
    const reduzirMovimento = useReducaoMovimentoTour()
    const dimensoes = useWindowDimensions()
    const insets = useSafeAreaInsets()
    const raiz = useRef<View>(null)
    const [viewport, setViewport] = useState<RetanguloAlvoTour | null>(null)
    const [alturaCartao, setAlturaCartao] = useState(300)
    const passo = controlador.definicao.passos[estado.passoAtual] ?? controlador.definicao.passos[0]!
    const medirViewport = useCallback(() => {
        raiz.current?.measureInWindow((x, y, largura, altura) => {
            if (largura <= 0 || altura <= 0) return
            setViewport(atual => atual?.x === x && atual.y === y && atual.largura === largura && atual.altura === altura ? atual : { x, y, largura, altura })
        })
    }, [])
    useEffect(() => {
        setViewport(null)
        alvos.invalidar()
        const frame = requestAnimationFrame(medirViewport)
        return () => cancelAnimationFrame(frame)
    }, [alvos, dimensoes.width, dimensoes.height, medirViewport])
    const medida = useMedidaAlvoTour(alvos, passo.alvo, aberto, viewport)
    const medido = medida.alvo
    useEffect(() => {
        if (aberto && medida.concluida && !medido && passo.indisponivel === 'PULAR') controlador.avancar()
    }, [aberto, controlador, medida.concluida, medido, passo])
    const largura = viewport?.largura ?? dimensoes.width
    const altura = viewport?.altura ?? dimensoes.height
    const topoSeguro = insets.top + 16
    const fundoSeguro = altura - insets.bottom - 16
    const larguraCartao = Math.min(440, largura - insets.left - insets.right - 32)
    const esquerdaCartao = insets.left + (largura - insets.left - insets.right - larguraCartao) / 2
    const alvo = medido && medido.y >= insets.top && medido.x >= insets.left
        && medido.y + medido.altura <= altura - insets.bottom && medido.x + medido.largura <= largura - insets.right ? medido : null
    const cabeAbaixo = alvo && fundoSeguro - (alvo.y + alvo.altura + 16) >= alturaCartao
    const cabeAcima = alvo && alvo.y - 16 - topoSeguro >= alturaCartao
    const destaque = alvo && (cabeAcima || cabeAbaixo) ? alvo : null
    const acima = passo.posicao === 'ACIMA' ? cabeAcima : !cabeAbaixo && cabeAcima
    const top = destaque ? (acima ? destaque.y - alturaCartao - 16 : destaque.y + destaque.altura + 16) : Math.max(topoSeguro, (altura - alturaCartao) / 2)
    const ultimo = estado.passoAtual === controlador.definicao.passos.length - 1

    return <Modal visible={aberto} transparent animationType={reduzirMovimento ? 'none' : 'fade'} statusBarTranslucent onShow={medirViewport} onRequestClose={controlador.pular}>
        <View ref={raiz} collapsable={false} onLayout={medirViewport} accessibilityViewIsModal style={{ flex: 1 }}>
            <Mascara alvo={destaque} largura={largura} altura={altura} cor={cores.sobreposicao} />
            {destaque ? <View pointerEvents="none" style={{ position: 'absolute', left: destaque.x, top: destaque.y, width: destaque.largura, height: destaque.altura, borderWidth: 3, borderRadius: 12, borderColor: cores.destaque }} /> : null}
            <View onLayout={evento => setAlturaCartao(evento.nativeEvent.layout.height)} style={{ position: 'absolute', top, left: esquerdaCartao, width: larguraCartao, maxHeight: Math.max(100, fundoSeguro - topoSeguro), padding: 18, borderRadius: 18, gap: 12, borderWidth: 1, borderColor: cores.borda, backgroundColor: cores.superficie }}>
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
                    <Text accessibilityRole="header" style={{ color: cores.texto, fontSize: 21, fontWeight: '800' }}>{passo.titulo}</Text>
                    <Text style={{ color: cores.textoSecundario }}>Passo {estado.passoAtual + 1} de {controlador.definicao.passos.length}</Text>
                    <Text style={{ color: cores.texto, fontSize: 16, lineHeight: 24 }}>{passo.descricao}</Text>
                    {!destaque ? <Text style={{ color: cores.textoSecundario }}>O elemento não está visível ou não há espaço para destacá-lo. Você pode continuar normalmente.</Text> : null}
                    {erro ? <Text accessibilityRole="alert" style={{ color: cores.perigo }}>{erro}</Text> : null}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        <AcaoTour texto="Voltar" acao={controlador.voltar} desabilitado={estado.passoAtual === 0} />
                        <AcaoTour texto="Pular" acao={controlador.pular} />
                        <AcaoTour texto={ultimo ? 'Concluir' : 'Próximo'} acao={ultimo ? controlador.concluir : controlador.avancar} />
                    </View>
                </ScrollView>
            </View>
        </View>
    </Modal>
}

function Mascara({ alvo, largura, altura, cor }: { alvo: RetanguloAlvoTour | null; largura: number; altura: number; cor: string }) {
    const areas: ViewStyle[] = alvo ? [
        { left: 0, top: 0, width: largura, height: alvo.y },
        { left: 0, top: alvo.y + alvo.altura, width: largura, height: Math.max(0, altura - alvo.y - alvo.altura) },
        { left: 0, top: alvo.y, width: alvo.x, height: alvo.altura },
        { left: alvo.x + alvo.largura, top: alvo.y, width: Math.max(0, largura - alvo.x - alvo.largura), height: alvo.altura },
    ] : [{ left: 0, top: 0, width: largura, height: altura }]
    return <>{areas.map((area, i) => <View key={i} pointerEvents="none" style={[{ position: 'absolute', backgroundColor: cor }, area]} />)}</>
}

export function AcaoTour({ texto, acao, desabilitado = false }: { texto: string; acao: () => void; desabilitado?: boolean }) {
    const { cores } = useTema()
    return <Pressable accessibilityRole="button" accessibilityState={{ disabled: desabilitado }} disabled={desabilitado} onPress={acao} style={{ minHeight: 48, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, justifyContent: 'center', borderWidth: 1, borderColor: cores.borda, backgroundColor: cores.superficieElevada, opacity: desabilitado ? 0.45 : 1 }}>
        <Text style={{ color: cores.texto, fontWeight: '700' }}>{texto}</Text>
    </Pressable>
}
