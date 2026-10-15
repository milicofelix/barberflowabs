import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TOUR_MAPA, type DefinicaoTour } from '@uniflowabs/core'
import { ProvedorTour, useTour } from '@/src/components/tour/ContextoTour'
import AlvoTour from '@/src/components/tour/AlvoTour'
import SobreposicaoTour, { AcaoTour } from '@/src/components/tour/SobreposicaoTour'
import useTema from '@/src/data/contexts/ContextoTema'

const DEMONSTRACAO: DefinicaoTour = {
    ...TOUR_MAPA,
    id: 'mapa-demonstracao',
    chavePersistencia: '@uniflowabs/tour_mapa:demonstracao:v1',
    passos: [
        { ...TOUR_MAPA.passos[0]!, titulo: 'Demonstração do tour', descricao: 'Esta tela demonstra a fundação do tour com componentes comuns. Ela não utiliza mapa, estabelecimentos ou localização.' },
        { ...TOUR_MAPA.passos[3]!, descricao: 'Um alvo registrado recebe destaque quando está visível. Este botão é apenas uma demonstração visual.' },
        { ...TOUR_MAPA.passos[2]!, descricao: 'O destaque é medido na tela, sem coordenadas fixas. Ao girar o dispositivo, a posição é recalculada.' },
        { id: 'ausente', alvo: 'demonstracao.ausente', titulo: 'Sem alvo disponível', descricao: 'Este passo não tem alvo de propósito. A explicação continua disponível e você pode concluir ou pular sem ficar preso.', posicao: 'AUTOMATICA', indisponivel: 'EXPLICAR' },
    ],
}

export default function TourMapaDemonstracao() {
    return <ProvedorTour definicao={DEMONSTRACAO}><Demonstracao /></ProvedorTour>
}

function Demonstracao() {
    const { cores } = useTema()
    const { controlador, alvos, estado, carregando, erro } = useTour()
    const [ocultarAlvo, setOcultarAlvo] = useState(false)
    useEffect(() => {
        if (carregando) return
        const timer = setTimeout(() => controlador.iniciar(true), 350)
        return () => clearTimeout(timer)
    }, [carregando, controlador])
    return <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }} edges={['bottom']}>
        <ScrollView onScroll={alvos.invalidar} scrollEventThrottle={32} onContentSizeChange={alvos.invalidar} contentContainerStyle={{ padding: 20, gap: 24 }}>
            <AlvoTour chave="descoberta.cabecalho"><Text accessibilityRole="header" style={{ color: cores.texto, fontSize: 25, fontWeight: '800' }}>Fundação do tour guiado</Text></AlvoTour>
            <Text style={{ color: cores.textoSecundario }}>Somente desenvolvimento. Esta demonstração tem progresso separado do tour definitivo do mapa.</Text>
            <Text style={{ color: cores.texto }}>Estado: {carregando ? 'Carregando…' : estado.status} · Passo {estado.passoAtual + 1}</Text>
            {erro ? <Text accessibilityRole="alert" style={{ color: cores.perigo }}>{erro}</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <AcaoTour texto="Iniciar ou retomar" desabilitado={carregando} acao={() => { controlador.iniciar() }} />
                <AcaoTour texto="Reiniciar demonstração" desabilitado={carregando} acao={() => { controlador.reiniciar() }} />
            </View>
            <AcaoTour texto={ocultarAlvo ? 'Exibir alvo de exemplo' : 'Ocultar alvo de exemplo'} acao={() => setOcultarAlvo(v => !v)} />
            {!ocultarAlvo ? <AlvoTour chave="descoberta.filtros"><View style={{ padding: 18, borderRadius: 12, borderWidth: 1, borderColor: cores.borda, backgroundColor: cores.superficie }}><Text style={{ color: cores.texto, fontWeight: '700' }}>Filtros — componente de exemplo</Text></View></AlvoTour> : null}
            <AlvoTour chave="descoberta.categorias"><View style={{ padding: 20, gap: 12, borderRadius: 12, backgroundColor: cores.superficie }}><Text style={{ color: cores.texto, fontWeight: '700' }}>Categorias — componente de exemplo</Text><Text style={{ color: cores.textoSecundario }}>Alvos possuem nomes semânticos. Nenhum filtro real é alterado nesta tela.</Text></View></AlvoTour>
            <View style={{ height: 350, justifyContent: 'center' }}><Text style={{ color: cores.textoSecundario }}>Role e retome o tour para conferir o comportamento com elementos fora da área visível.</Text></View>
        </ScrollView>
        <SobreposicaoTour />
    </SafeAreaView>
}
