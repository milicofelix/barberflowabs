import type { EstabelecimentoResumo } from '@/src/data/barbearias/tipos'
import MapView, { Marker } from 'react-native-maps'
import { StyleSheet, View } from 'react-native'

interface Props {
    estabelecimentos: EstabelecimentoResumo[]
    abrir: (slug: string) => void
}

export default function MapaMarketplace({ estabelecimentos, abrir }: Props) {
    const pontos = estabelecimentos.filter((item) => item.endereco.latitude != null && item.endereco.longitude != null)
    if (!pontos.length) return null
    const primeiro = pontos[0]
    return (
        <View style={styles.container}>
            <MapView style={styles.mapa} initialRegion={{
                latitude: Number(primeiro.endereco.latitude), longitude: Number(primeiro.endereco.longitude),
                latitudeDelta: 0.08, longitudeDelta: 0.08,
            }}>
                {pontos.map((item) => <Marker key={item.id}
                    coordinate={{ latitude: Number(item.endereco.latitude), longitude: Number(item.endereco.longitude) }}
                    title={item.nome} description={item.especialidades?.map((e) => e.nome).join(' · ')}
                    onCalloutPress={() => abrir(item.slug)} />)}
            </MapView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { height: 330, borderRadius: 16, overflow: 'hidden', marginBottom: 18 },
    mapa: { flex: 1 },
})
