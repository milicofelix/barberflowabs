import CartaoEstabelecimento from '@/src/components/marketplace/CartaoEstabelecimento'
import MapaMarketplace from '@/src/components/marketplace/MapaMarketplace'
import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useEstabelecimento from '@/src/data/hooks/useEstabelecimento'
import useMarketplace, { FILTROS_INICIAIS } from '@/src/data/hooks/useMarketplace'
import type { FiltrosMarketplace } from '@/src/data/hooks/useMarketplace'
import type { AbasParamList, StackParamList } from '@/src/navigation/types'
import { Ionicons } from '@expo/vector-icons'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as Location from 'expo-location'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, ImageBackground, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'
import MarcaUniFlow from '@/src/components/shared/MarcaUniFlow'
import { tituloDaCategoria, visualDaCategoria } from '@/src/data/estabelecimentos/categorias-visuais'
import type { CategoriaMarketplace } from '@/src/data/estabelecimentos/tipos'
import type { ComponentProps } from 'react'

type Props = BottomTabScreenProps<AbasParamList, 'Descobrir'>
const RAIOS = [2, 5, 10, 25]

export default function Descoberta({ navigation }: Props) {
    const { cores } = useTema()
    const { estabelecimento: selecionado } = useEstabelecimento()
    const [filtros, setFiltros] = useState<FiltrosMarketplace>(FILTROS_INICIAIS)
    const [mostrarFiltros, setMostrarFiltros] = useState(false)
    const [mostrarMapa, setMostrarMapa] = useState(false)
    const [localizando, setLocalizando] = useState(false)
    const marketplace = useMarketplace(filtros)
    const categoriaSelecionada = marketplace.categorias.find((categoria) => categoria.slug === filtros.segmento)
    const visualSelecionado = visualDaCategoria(categoriaSelecionada?.slug, categoriaSelecionada?.nome)
    const atualizar = <K extends keyof FiltrosMarketplace>(campo: K, valor: FiltrosMarketplace[K]) =>
        setFiltros((atuais) => ({ ...atuais, [campo]: valor }))
    const abrir = (slug: string) => navigation.getParent<NativeStackNavigationProp<StackParamList>>()
        ?.navigate('PerfilEstabelecimento', { slug })

    async function localizar(raioKm = filtros.raioKm) {
        try {
            setLocalizando(true)
            const permissao = await Location.requestForegroundPermissionsAsync()
            if (!permissao.granted) return
            const local = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            setFiltros((atuais) => ({
                ...atuais,
                posicao: { lat: local.coords.latitude, lng: local.coords.longitude },
                raioKm,
            }))
        } finally { setLocalizando(false) }
    }

    function selecionarRaio(raioKm: number | null) {
        if (raioKm === null || filtros.posicao) {
            atualizar('raioKm', raioKm)
            return
        }
        void localizar(raioKm)
    }

    useEffect(() => {
        void localizar(FILTROS_INICIAIS.raioKm)
    }, [])

    return <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['top']}>
        <FlatList data={mostrarMapa ? [] : marketplace.itens} keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled"
            ListHeaderComponent={<View>
                <ImageBackground source={visualSelecionado.imagem} style={styles.hero} imageStyle={styles.heroImagem} resizeMode="cover">
                    <View style={styles.heroSobreposicao}>
                        <View style={styles.marca}><MarcaUniFlow horizontal contraste /></View>
                        <View>
                            <Text style={styles.sobretitulo}>MARKETPLACE UNIFLOW ABS</Text>
                            <Text style={styles.titulo}>{tituloDaCategoria(categoriaSelecionada?.slug, categoriaSelecionada?.nome)}</Text>
                            <Text style={styles.descricao}>Explore estabelecimentos, especialidades, preços e horários disponíveis.</Text>
                        </View>
                    </View>
                </ImageBackground>
                <View style={[styles.busca, { backgroundColor: cores.campo, borderColor: cores.borda, borderWidth: 1 }]}><Ionicons name="search-outline" size={21} color={cores.textoSecundario} />
                    <TextInput value={filtros.busca} onChangeText={(v) => atualizar('busca', v)}
                        placeholder="Estabelecimento, bairro ou cidade" placeholderTextColor={cores.textoSecundario} style={[styles.buscaInput, { color: cores.campoTexto }]} /></View>
                <View style={styles.acoes}>
                    <Botao icone="options-outline" texto="Filtros" acao={() => setMostrarFiltros(!mostrarFiltros)} />
                    <Botao icone="map-outline" texto={mostrarMapa ? 'Lista' : 'Mapa'} acao={() => setMostrarMapa(!mostrarMapa)} />
                    <Botao icone="locate-outline" texto={localizando ? '...' : 'Localizar'} acao={() => void localizar()} />
                </View>
                <Categorias categorias={marketplace.categorias} selecionada={filtros.segmento}
                    selecionar={(segmento: string) => atualizar('segmento', segmento)} />
                {mostrarFiltros ? <Filtros filtros={filtros} atualizar={atualizar} selecionarRaio={selecionarRaio} /> : null}
                {selecionado ? <Text style={styles.selecao}>✓ Selecionado: {selecionado.nome}</Text> : null}
                <Text style={[styles.contagem, { color: cores.textoSecundario }]}>{marketplace.carregando ? 'Buscando...' : `${marketplace.paginacao.total} resultado(s)`}</Text>
                {marketplace.erro ? <EstadoErro mensagem={marketplace.erro} tentarNovamente={marketplace.recarregar} /> : null}
                {marketplace.carregando && !mostrarMapa ? <Carregando mensagem="Consultando o marketplace..." /> : null}
                {mostrarMapa && marketplace.itens.length ? <View style={styles.mapaArea}>
                    <MapaMarketplace estabelecimentos={marketplace.itens} abrir={abrir} />
                    {marketplace.carregando ? <View style={[styles.mapaAtualizando, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                        <ActivityIndicator size="small" color={cores.destaque} />
                        <Text style={[styles.mapaAtualizandoTexto, { color: cores.texto }]}>Atualizando locais...</Text>
                    </View> : null}
                </View> : null}
                {mostrarMapa && marketplace.carregando && !marketplace.itens.length ? <Carregando mensagem="Carregando o mapa..." /> : null}
                {mostrarMapa && !marketplace.carregando && !marketplace.itens.length && !marketplace.erro
                    ? <EstadoVazio titulo="Nenhum local encontrado no mapa" descricao="Escolha outra categoria ou altere os filtros." /> : null}
            </View>}
            renderItem={({ item }) => <CartaoEstabelecimento item={item} selecionado={selecionado?.id === item.id} abrir={() => abrir(item.slug)} />}
            ListEmptyComponent={!marketplace.carregando && !marketplace.erro && !mostrarMapa
                ? <EstadoVazio titulo="Nenhum estabelecimento encontrado" descricao="Altere os filtros ou amplie a distância." /> : null} />
    </SafeAreaView>
}

interface CategoriasProps {
    categorias: CategoriaMarketplace[]
    selecionada: string
    selecionar: (slug: string) => void
}

function Categorias({ categorias, selecionada, selecionar }: CategoriasProps) {
    const { cores } = useTema()
    const [larguraVisivel, setLarguraVisivel] = useState(0)
    const [larguraConteudo, setLarguraConteudo] = useState(0)
    const [deslocamento, setDeslocamento] = useState(0)
    const temAnterior = deslocamento > 8
    const temMais = larguraConteudo > larguraVisivel && deslocamento + larguraVisivel < larguraConteudo - 8

    return <View style={styles.categoriasContainer} onLayout={(evento) => setLarguraVisivel(evento.nativeEvent.layout.width)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categorias}
            onContentSizeChange={(largura) => setLarguraConteudo(largura)}
            onScroll={(evento) => setDeslocamento(evento.nativeEvent.contentOffset.x)} scrollEventThrottle={16}>
            <CategoriaCard texto="Todos" slug="" ativo={!selecionada} acao={() => selecionar('')} />
            {categorias.map((item) => <CategoriaCard key={item.id} texto={item.nome} slug={item.slug}
                ativo={selecionada === item.slug} acao={() => selecionar(item.slug)} />)}
        </ScrollView>
        {temAnterior ? <View pointerEvents="none" style={[styles.categoriasIndicador, styles.categoriasIndicadorEsquerda, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <Ionicons name="chevron-back" size={22} color={cores.destaque} />
        </View> : null}
        {temMais ? <View pointerEvents="none" style={[styles.categoriasIndicador, styles.categoriasIndicadorDireita, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <Ionicons name="chevron-forward" size={22} color={cores.destaque} />
        </View> : null}
    </View>
}

function CategoriaCard({ texto, slug, ativo, acao }: { texto: string; slug: string; ativo: boolean; acao: () => void }) {
    const { cores } = useTema()
    const visual = visualDaCategoria(slug, texto)
    return <Pressable onPress={acao} style={[styles.categoriaCard, { backgroundColor: cores.superficie, borderColor: ativo ? cores.destaque : cores.borda }]}
        accessibilityRole="button" accessibilityState={{ selected: ativo }}>
        <ImageBackground source={visual.imagem} style={styles.categoriaImagem} imageStyle={styles.categoriaImagemBorda} resizeMode="cover">
            <View style={[styles.categoriaIcone, { backgroundColor: ativo ? cores.destaque : 'rgba(255,255,255,.92)' }]}>
                <Ionicons name={visual.icone as ComponentProps<typeof Ionicons>['name']} size={17} color={ativo ? cores.destaqueTexto : '#7C3AED'} />
            </View>
        </ImageBackground>
        <Text numberOfLines={2} style={[styles.categoriaTexto, { color: cores.texto }]}>{texto}</Text>
    </Pressable>
}

function Filtros({ filtros, atualizar, selecionarRaio }: {
    filtros: FiltrosMarketplace
    atualizar: <K extends keyof FiltrosMarketplace>(campo: K, valor: FiltrosMarketplace[K]) => void
    selecionarRaio: (raioKm: number | null) => void
}) {
    const { cores } = useTema()
    const inputTema = { backgroundColor: cores.campo, color: cores.campoTexto, borderColor: cores.borda }
    return <View style={[styles.filtros, { backgroundColor: cores.superficie }]}>
        <TextInput style={[styles.input, inputTema]} value={filtros.cidade} onChangeText={(v) => atualizar('cidade', v)} placeholder="Cidade" placeholderTextColor={cores.textoSecundario} />
        <TextInput style={[styles.input, inputTema]} value={filtros.especialidade} onChangeText={(v) => atualizar('especialidade', v)} placeholder="Especialidade" placeholderTextColor={cores.textoSecundario} />
        <TextInput style={[styles.input, inputTema]} value={filtros.precoMax} onChangeText={(v) => atualizar('precoMax', v.replace(/[^0-9.,]/g, '').replace(',', '.'))} placeholder="Preço máximo" keyboardType="decimal-pad" placeholderTextColor={cores.textoSecundario} />
        <TextInput style={[styles.input, inputTema]} value={filtros.disponivelEm} onChangeText={(v) => atualizar('disponivelEm', v)} placeholder="Disponível em: 2026-10-15T14:00:00-03:00" placeholderTextColor={cores.textoSecundario} autoCapitalize="none" />
        <View style={styles.linha}><Text style={[styles.label, { color: cores.texto }]}>Aberto agora</Text><Switch value={filtros.abertaAgora} onValueChange={(v) => atualizar('abertaAgora', v)} /></View>
        <Text style={[styles.label, { color: cores.texto }]}>Avaliação mínima</Text><View style={styles.chips}>{[0, 4, 4.5].map((nota) => <Chip key={nota} texto={nota ? `${nota}+` : 'Todas'} ativo={filtros.notaMin === nota} acao={() => atualizar('notaMin', nota)} />)}</View>
        <Text style={[styles.label, { color: cores.texto }]}>Distância {filtros.posicao
            ? filtros.raioKm === null ? '· sem limite' : `· até ${filtros.raioKm} km`
            : '· use sua localização'}</Text>
        <View style={styles.chips}>
            {RAIOS.map((raio) => <Chip key={raio} texto={`${raio} km`} ativo={filtros.raioKm === raio} acao={() => selecionarRaio(raio)} />)}
            <Chip texto="Sem limite" ativo={filtros.raioKm === null} acao={() => selecionarRaio(null)} />
        </View>
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
    hero: { minHeight: 310, marginHorizontal: -18, marginTop: -18 }, heroImagem: { opacity: 1 },
    heroSobreposicao: { flex: 1, minHeight: 310, justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, backgroundColor: 'rgba(3,8,24,.56)' },
    marca: { alignSelf: 'flex-start', maxWidth: '88%', paddingRight: 8, borderRadius: 18, backgroundColor: 'rgba(3,8,24,.52)' },
    sobretitulo: { color: '#F2C35B', fontSize: 12, fontWeight: '800', letterSpacing: 1.3 }, titulo: { color: '#FFFFFF', fontSize: 30, lineHeight: 35, fontWeight: '900', marginTop: 8, textShadowColor: 'rgba(0,0,0,.75)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5 },
    descricao: { color: '#F1F5F9', lineHeight: 21, marginTop: 8, textShadowColor: 'rgba(0,0,0,.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }, busca: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14, backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14 },
    buscaInput: { flex: 1, minHeight: 52, color: '#101828' }, acoes: { flexDirection: 'row', gap: 7, marginTop: 10 }, botao: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: '#35435A', borderRadius: 10, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
    botaoTexto: { color: '#E7EAF0', fontSize: 12, fontWeight: '700' }, categoriasContainer: { position: 'relative' }, categorias: { gap: 9, paddingVertical: 15, paddingRight: 46 },
    categoriasIndicador: { position: 'absolute', top: 51, width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 5 },
    categoriasIndicadorEsquerda: { left: 2 }, categoriasIndicadorDireita: { right: 2 },
    categoriaCard: { width: 116, minHeight: 116, overflow: 'hidden', borderWidth: 2, borderRadius: 15 },
    categoriaImagem: { height: 74, padding: 8 }, categoriaImagemBorda: { borderTopLeftRadius: 13, borderTopRightRadius: 13 },
    categoriaIcone: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
    categoriaTexto: { minHeight: 40, paddingHorizontal: 7, paddingVertical: 7, fontSize: 12, lineHeight: 14, fontWeight: '800', textAlign: 'center' },
    chip: { borderRadius: 999, borderWidth: 1, borderColor: '#43516A', paddingHorizontal: 12, paddingVertical: 8 },
    chipAtivo: { backgroundColor: '#E7B84B', borderColor: '#E7B84B' }, chipTexto: { color: '#CDD5E1', fontSize: 12, fontWeight: '700' }, chipTextoAtivo: { color: '#081426' },
    filtros: { backgroundColor: '#101E33', borderRadius: 14, padding: 14, gap: 11 }, input: { minHeight: 45, borderRadius: 10, backgroundColor: '#17263D', color: '#FFF', paddingHorizontal: 13, borderWidth: 1, borderColor: '#31415A' },
    linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, label: { color: '#CDD5E1', fontSize: 13, fontWeight: '700' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selecao: { color: '#C6F5DF', backgroundColor: '#12352E', padding: 12, borderRadius: 11, marginTop: 14 }, contagem: { color: '#AEBBCE', marginVertical: 17 },
    mapaArea: { position: 'relative' },
    mapaAtualizando: { position: 'absolute', top: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 999, shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 6 },
    mapaAtualizandoTexto: { fontSize: 12, fontWeight: '800' },
})
