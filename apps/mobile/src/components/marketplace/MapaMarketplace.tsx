import type { EstabelecimentoResumo } from '@/src/data/estabelecimentos/tipos'
import { marcadorDoEstabelecimento } from '@/src/data/estabelecimentos/marcadores'
import MapView, { Marker, type Region } from 'react-native-maps'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useMemo, useRef, useState, type RefObject } from 'react'
import useAlvoMarcadorTour from './useAlvoMarcadorTour'
import { possuiCoordenadasMapa } from '@/src/data/tour/pontos-mapa'
import useTema from '@/src/data/contexts/ContextoTema'

interface Props {
    estabelecimentos: EstabelecimentoResumo[]
    abrir: (slug: string) => void
    selecionar: (item: EstabelecimentoResumo) => void
    selecionadoId?: number
    regiaoInicial?: Region
    alterarRegiao: (regiao: Region) => void
    aoPronto: () => void
    viewport: RefObject<View | null>
}

export default function MapaMarketplace({ estabelecimentos, abrir, selecionar, selecionadoId, regiaoInicial, alterarRegiao, aoPronto, viewport }: Props) {
    const mapa = useRef<MapView>(null)
    const container = useRef<View>(null)
    const [pronto, setPronto] = useState(false)
    const { cores } = useTema()
    const pontos = useMemo(() => estabelecimentos.filter(possuiCoordenadasMapa), [estabelecimentos])
    const invalidar = useAlvoMarcadorTour(mapa, container, viewport, pontos, pronto, selecionadoId)
    const primeiro = pontos[0]
    const inicio = useRef<Region | undefined>(regiaoInicial)
    if (!inicio.current && primeiro) inicio.current = {
        latitude: Number(primeiro.endereco.latitude), longitude: Number(primeiro.endereco.longitude), latitudeDelta: 0.08, longitudeDelta: 0.08,
    }
    return (
        <View ref={container} collapsable={false} onLayout={invalidar} style={styles.container}>
            {inicio.current ? <MapView ref={mapa} style={styles.mapa} moveOnMarkerPress={false} onMapReady={() => { setPronto(true); aoPronto() }}
                onRegionChangeComplete={(regiao) => { alterarRegiao(regiao); invalidar() }}
                onRegionChange={invalidar}
                initialRegion={inicio.current}>
                {pontos.map((item) => <Marker key={item.id}
                    coordinate={{ latitude: Number(item.endereco.latitude), longitude: Number(item.endereco.longitude) }}
                    title={item.nome} description={item.especialidades?.map((e) => e.nome).join(' · ')}
                    anchor={{ x: 0.5, y: 0.95 }} tracksViewChanges={false}
                    onPress={() => selecionar(item)}
                    onCalloutPress={() => abrir(item.slug)}>
                    <Image source={marcadorDoEstabelecimento(item)} style={styles.marcador} resizeMode="contain" />
                </Marker>)}
            </MapView> : <View style={{ flex: 1, justifyContent: 'center', padding: 18, backgroundColor: cores.superficie }}><Text style={{ color: cores.texto }}>Nenhum local com coordenadas disponível para exibir.</Text></View>}
        </View>
    )
}

const styles = StyleSheet.create({
    container: { height: 330, borderRadius: 16, overflow: 'hidden', marginBottom: 18 },
    mapa: { flex: 1 },
    marcador: { width: 54, height: 54 },
})
