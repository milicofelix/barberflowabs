import CartaoEstabelecimento from '@/src/components/marketplace/CartaoEstabelecimento'
import MapaMarketplace from '@/src/components/marketplace/MapaMarketplace'
import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useBarbearia from '@/src/data/hooks/useBarbearia'
import useMarketplace, { FILTROS_INICIAIS } from '@/src/data/hooks/useMarketplace'
import type { FiltrosMarketplace } from '@/src/data/hooks/useMarketplace'
import type { AbasParamList, StackParamList } from '@/src/navigation/types'
import { Ionicons } from '@expo/vector-icons'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as Location from 'expo-location'
import { useState } from 'react'
import { FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'

type Props = BottomTabScreenProps<AbasParamList, 'Descobrir'>
const RAIOS = [2, 5, 10, 25]

export default function Descoberta({ navigation }: Props) {
    const { cores } = useTema()
    const { barbearia: selecionado } = useBarbearia()
    const [filtros, setFiltros] = useState<FiltrosMarketplace>(FILTROS_INICIAIS)
    const [mostrarFiltros, setMostrarFiltros] = useState(false)
    const [mostrarMapa, setMostrarMapa] = useState(false)
    const [localizando, setLocalizando] = useState(false)
    const marketplace = useMarketplace(filtros)
    const atualizar = <K extends keyof FiltrosMarketplace>(campo: K, valor: FiltrosMarketplace[K]) =>
        setFiltros((atuais) => ({ ...atuais, [campo]: valor }))
    const abrir = (slug: string) => navigation.getParent<NativeStackNavigationProp<StackParamList>>()
        ?.navigate('PerfilBarbearia', { slug })

    async function localizar() {
        try {
            setLocalizando(true)
            const permissao = await Location.requestForegroundPermissionsAsync()
            if (!permissao.granted) return
            const local = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            atualizar('posicao', { lat: local.coords.latitude, lng: local.coords.longitude })
        } finally { setLocalizando(false) }
    }

    return <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['top']}>
        <FlatList data={mostrarMapa ? [] : marketplace.itens} keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled"
            ListHeaderComponent={<View>
                <Text style={styles.sobretitulo}>MARKETPLACE UNIFLOW ABS</Text>
                <Text style={[styles.titulo, { color: cores.texto }]}>Encontre o cuidado ideal para você</Text>
                <Text style={[styles.descricao, { color: cores.textoSecundario }]}>Explore estabelecimentos, especialidades, preços e horários disponíveis.</Text>
                <View style={[styles.busca, { backgroundColor: cores.campo, borderColor: cores.borda, borderWidth: 1 }]}><Ionicons name="search-outline" size={21} color={cores.textoSecundario} />
                    <TextInput value={filtros.busca} onChangeText={(v) => atualizar('busca', v)}
                        placeholder="Estabelecimento, bairro ou cidade" placeholderTextColor={cores.textoSecundario} style={[styles.buscaInput, { color: cores.campoTexto }]} /></View>
                <View style={styles.acoes}>
                    <Botao icone="options-outline" texto="Filtros" acao={() => setMostrarFiltros(!mostrarFiltros)} />
                    <Botao icone="map-outline" texto={mostrarMapa ? 'Lista' : 'Mapa'} acao={() => setMostrarMapa(!mostrarMapa)} />
                    <Botao icone="locate-outline" texto={localizando ? '...' : 'Localizar'} acao={localizar} />
                </View>
                <Categorias categorias={marketplace.categorias} selecionada={filtros.segmento}
                    selecionar={(segmento: string) => atualizar('segmento', segmento)} />
                {mostrarFiltros ? <Filtros filtros={filtros} atualizar={atualizar} /> : null}
                {selecionado ? <Text style={styles.selecao}>✓ Selecionado: {selecionado.nome}</Text> : null}
                <Text style={[styles.contagem, { color: cores.textoSecundario }]}>{marketplace.carregando ? 'Buscando...' : `${marketplace.paginacao.total} resultado(s)`}</Text>
                {marketplace.erro ? <EstadoErro mensagem={marketplace.erro} tentarNovamente={marketplace.recarregar} /> : null}
                {marketplace.carregando ? <Carregando mensagem="Consultando o marketplace..." /> : null}
                {!marketplace.carregando && mostrarMapa ? <MapaMarketplace estabelecimentos={marketplace.itens} abrir={abrir} /> : null}
            </View>}
            renderItem={({ item }) => <CartaoEstabelecimento item={item} selecionado={selecionado?.id === item.id} abrir={() => abrir(item.slug)} />}
            ListEmptyComponent={!marketplace.carregando && !marketplace.erro && !mostrarMapa
                ? <EstadoVazio titulo="Nenhum estabelecimento encontrado" descricao="Altere os filtros ou amplie a distância." /> : null} />
    </SafeAreaView>
}

function Categorias({ categorias, selecionada, selecionar }: any) {
    return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categorias}>
        <Chip texto="Todos" ativo={!selecionada} acao={() => selecionar('')} />
        {categorias.map((item: any) => <Chip key={item.id} texto={item.nome} ativo={selecionada === item.slug} acao={() => selecionar(item.slug)} />)}
    </ScrollView>
}

function Filtros({ filtros, atualizar }: { filtros: FiltrosMarketplace; atualizar: <K extends keyof FiltrosMarketplace>(campo: K, valor: FiltrosMarketplace[K]) => void }) {
    const { cores } = useTema()
    const inputTema = { backgroundColor: cores.campo, color: cores.campoTexto, borderColor: cores.borda }
    return <View style={[styles.filtros, { backgroundColor: cores.superficie }]}>
        <TextInput style={[styles.input, inputTema]} value={filtros.cidade} onChangeText={(v) => atualizar('cidade', v)} placeholder="Cidade" placeholderTextColor={cores.textoSecundario} />
        <TextInput style={[styles.input, inputTema]} value={filtros.especialidade} onChangeText={(v) => atualizar('especialidade', v)} placeholder="Especialidade" placeholderTextColor={cores.textoSecundario} />
        <TextInput style={[styles.input, inputTema]} value={filtros.precoMax} onChangeText={(v) => atualizar('precoMax', v.replace(/[^0-9.,]/g, '').replace(',', '.'))} placeholder="Preço máximo" keyboardType="decimal-pad" placeholderTextColor={cores.textoSecundario} />
        <TextInput style={[styles.input, inputTema]} value={filtros.disponivelEm} onChangeText={(v) => atualizar('disponivelEm', v)} placeholder="Disponível em: 2026-10-15T14:00:00-03:00" placeholderTextColor={cores.textoSecundario} autoCapitalize="none" />
        <View style={styles.linha}><Text style={[styles.label, { color: cores.texto }]}>Aberto agora</Text><Switch value={filtros.abertaAgora} onValueChange={(v) => atualizar('abertaAgora', v)} /></View>
        <Text style={[styles.label, { color: cores.texto }]}>Avaliação mínima</Text><View style={styles.chips}>{[0, 4, 4.5].map((nota) => <Chip key={nota} texto={nota ? `${nota}+` : 'Todas'} ativo={filtros.notaMin === nota} acao={() => atualizar('notaMin', nota)} />)}</View>
        <Text style={[styles.label, { color: cores.texto }]}>Distância {filtros.posicao ? `· até ${filtros.raioKm} km` : '· use sua localização'}</Text>
        <View style={styles.chips}>{RAIOS.map((raio) => <Chip key={raio} texto={`${raio} km`} ativo={filtros.raioKm === raio} acao={() => atualizar('raioKm', raio)} />)}</View>
    </View>
}

function Botao({ icone, texto, acao }: { icone: any; texto: string; acao: () => void }) {
    const { cores } = useTema()
    return <Pressable style={[styles.botao, { borderColor: cores.borda }]} onPress={acao}><Ionicons name={icone} size={17} color={cores.destaque} /><Text style={[styles.botaoTexto, { color: cores.texto }]}>{texto}</Text></Pressable>
}
function Chip({ texto, ativo, acao }: { texto: string; ativo: boolean; acao: () => void }) {
    const { cores } = useTema()
    return <Pressable onPress={acao} style={[styles.chip, { borderColor: cores.borda }, ativo && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}><Text style={[styles.chipTexto, { color: ativo ? cores.destaqueTexto : cores.texto }]}>{texto}</Text></Pressable>
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' }, lista: { padding: 18, paddingBottom: 36 },
    sobretitulo: { color: '#E7B84B', fontSize: 12, fontWeight: '800', letterSpacing: 1.3 }, titulo: { color: '#FFF', fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 8 },
    descricao: { color: '#AEBBCE', lineHeight: 21, marginTop: 8, marginBottom: 18 }, busca: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14 },
    buscaInput: { flex: 1, minHeight: 52, color: '#101828' }, acoes: { flexDirection: 'row', gap: 7, marginTop: 10 }, botao: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: '#35435A', borderRadius: 10, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
    botaoTexto: { color: '#E7EAF0', fontSize: 12, fontWeight: '700' }, categorias: { gap: 8, paddingVertical: 15 }, chip: { borderRadius: 999, borderWidth: 1, borderColor: '#43516A', paddingHorizontal: 12, paddingVertical: 8 },
    chipAtivo: { backgroundColor: '#E7B84B', borderColor: '#E7B84B' }, chipTexto: { color: '#CDD5E1', fontSize: 12, fontWeight: '700' }, chipTextoAtivo: { color: '#081426' },
    filtros: { backgroundColor: '#101E33', borderRadius: 14, padding: 14, gap: 11 }, input: { minHeight: 45, borderRadius: 10, backgroundColor: '#17263D', color: '#FFF', paddingHorizontal: 13, borderWidth: 1, borderColor: '#31415A' },
    linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, label: { color: '#CDD5E1', fontSize: 13, fontWeight: '700' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selecao: { color: '#C6F5DF', backgroundColor: '#12352E', padding: 12, borderRadius: 11, marginTop: 14 }, contagem: { color: '#AEBBCE', marginVertical: 17 },
})
