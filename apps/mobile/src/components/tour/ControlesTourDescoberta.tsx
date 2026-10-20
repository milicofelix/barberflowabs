import { Text, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'
import type useTourDescoberta from '@/src/data/hooks/useTourDescoberta'
import SobreposicaoTour, { AcaoTour } from './SobreposicaoTour'

export default function ControlesTourDescoberta({ tour }: { tour: ReturnType<typeof useTourDescoberta> }) {
    const { cores } = useTema()
    return <>
        {!tour.sessaoAtiva && tour.erro ? <Text accessibilityRole="alert" style={{ color: cores.perigo, padding: 12 }}>{tour.erro}</Text> : null}
        {tour.interagindo ? <View style={{ padding: 14, gap: 10, backgroundColor: cores.superficie, borderTopWidth: 1, borderColor: cores.borda }}>
            <Text accessibilityRole="header" style={{ color: cores.texto, fontWeight: '800' }}>Selecione um marcador real no mapa</Text>
            <Text style={{ color: cores.textoSecundario }}>O tour está pausado neste passo. Se não houver marcador visível, volte ao tour e continue normalmente.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <AcaoTour texto="Voltar ao tour" acao={tour.retomar} />
                <AcaoTour texto="Pular tour" acao={tour.pularInteracao} />
            </View>
        </View> : null}
        <SobreposicaoTour acaoContextual={tour.acaoContextual} />
    </>
}
