import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import type { BarbeariaResumo } from '@/src/data/barbearias/tipos'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useBarbearia from '@/src/data/hooks/useBarbearia'
import type { AbasParamList, StackParamList } from '@/src/navigation/types'
import { Ionicons } from '@expo/vector-icons'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as Location from 'expo-location'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    FlatList, ImageBackground, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Props = BottomTabScreenProps<AbasParamList, 'Descobrir'>
type Posicao = { lat: number; lng: number }
const RAIOS = [2, 5, 10, 25]
const NOTAS = [0, 4, 4.5]

export default function Descoberta({ navigation }: Props) {
    const { httpGet } = useAPI()
    const { barbearia: selecionada } = useBarbearia()
    const [barbearias, setBarbearias] = useState<BarbeariaResumo[]>([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const [q, setQ] = useState('')
    const [cidade, setCidade] = useState('')
    const [servico, setServico] = useState('')
    const [raioKm, setRaioKm] = useState(10)
    const [notaMinima, setNotaMinima] = useState(0)
    const [abertaAgora, setAbertaAgora] = useState(false)
    const [posicao, setPosicao] = useState<Posicao | null>(null)
    const [localizando, setLocalizando] = useState(false)
    const [mostrarFiltros, setMostrarFiltros] = useState(false)

    const query = useMemo(() => {
        const parametros: string[] = []
        const adicionar = (nome: string, valor: string | number) => parametros.push(`${nome}=${encodeURIComponent(valor)}`)
        if (q.trim()) adicionar('q', q.trim())
        if (cidade.trim()) adicionar('cidade', cidade.trim())
        if (servico.trim()) adicionar('servico', servico.trim())
        if (abertaAgora) adicionar('abertaAgora', 'true')
        if (posicao) {
            adicionar('lat', posicao.lat)
            adicionar('lng', posicao.lng)
            adicionar('raioKm', raioKm)
        }
        return parametros.length ? `?${parametros.join('&')}` : ''
    }, [abertaAgora, cidade, posicao, q, raioKm, servico])

    const carregar = useCallback(async () => {
        try {
            setCarregando(true)
            setErro(null)
            const dados = await httpGet<BarbeariaResumo[]>(`/public/barbearias${query}`, { escopoTenant: 'nenhum' })
            setBarbearias(Array.isArray(dados) ? dados : [])
        } catch (e) {
            setBarbearias([])
            setErro(mensagemDoErro(e))
        } finally {
            setCarregando(false)
        }
    }, [httpGet, query])

    useEffect(() => {
        const temporizador = setTimeout(carregar, 350)
        return () => clearTimeout(temporizador)
    }, [carregar])

    const resultados = useMemo(
        () => barbearias.filter((item) => notaMinima === 0 || (item.avaliacaoMedia ?? 0) >= notaMinima),
        [barbearias, notaMinima]
    )

    async function usarLocalizacao() {
        try {
            setLocalizando(true)
            setErro(null)
            const permissao = await Location.requestForegroundPermissionsAsync()
            if (!permissao.granted) {
                setErro('Permita o acesso à localização para encontrar barbearias próximas.')
                return
            }
            const local = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
            setPosicao({ lat: local.coords.latitude, lng: local.coords.longitude })
        } catch {
            setErro('Não foi possível obter sua localização. Confira as permissões do aparelho.')
        } finally {
            setLocalizando(false)
        }
    }

    function abrirPerfil(slug: string) {
        navigation.getParent<NativeStackNavigationProp<StackParamList>>()?.navigate('PerfilBarbearia', { slug })
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <FlatList
                data={resultados}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.lista}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={
                    <View>
                        <Text style={styles.sobretitulo}>DESCUBRA PERTO DE VOCÊ</Text>
                        <Text style={styles.titulo}>Encontre sua próxima barbearia</Text>
                        <Text style={styles.descricao}>Compare serviços, avaliações e horários antes de escolher.</Text>

                        <View style={styles.busca}>
                            <Ionicons name="search-outline" size={21} color="#748197" />
                            <TextInput
                                value={q} onChangeText={setQ} placeholder="Nome, bairro ou cidade"
                                placeholderTextColor="#748197" style={styles.buscaInput} returnKeyType="search"
                            />
                        </View>
                        <View style={styles.acoesBusca}>
                            <Pressable style={styles.botaoSecundario} onPress={() => setMostrarFiltros((valor) => !valor)}>
                                <Ionicons name="options-outline" size={18} color="#E7B84B" />
                                <Text style={styles.botaoSecundarioTexto}>Filtros</Text>
                            </Pressable>
                            <Pressable style={styles.botaoSecundario} onPress={usarLocalizacao} disabled={localizando}>
                                <Ionicons name="locate-outline" size={18} color="#E7B84B" />
                                <Text style={styles.botaoSecundarioTexto}>{localizando ? 'Localizando...' : 'Usar localização'}</Text>
                            </Pressable>
                        </View>

                        {mostrarFiltros ? (
                            <View style={styles.filtros}>
                                <TextInput value={cidade} onChangeText={setCidade} placeholder="Cidade"
                                    placeholderTextColor="#748197" style={styles.filtroInput} />
                                <TextInput value={servico} onChangeText={setServico} placeholder="Serviço desejado"
                                    placeholderTextColor="#748197" style={styles.filtroInput} />
                                <View style={styles.linhaFiltro}>
                                    <Text style={styles.filtroLabel}>Aberta agora</Text>
                                    <Switch value={abertaAgora} onValueChange={setAbertaAgora}
                                        trackColor={{ false: '#344054', true: '#92701E' }} thumbColor={abertaAgora ? '#E7B84B' : '#D0D5DD'} />
                                </View>
                                <Text style={styles.filtroLabel}>Avaliação mínima</Text>
                                <View style={styles.chips}>
                                    {NOTAS.map((nota) => <Chip key={nota} ativo={notaMinima === nota}
                                        texto={nota ? `${nota}+ estrelas` : 'Qualquer'} onPress={() => setNotaMinima(nota)} />)}
                                </View>
                                <Text style={styles.filtroLabel}>Distância {posicao ? `· até ${raioKm} km` : '· ative a localização'}</Text>
                                <View style={styles.chips}>
                                    {RAIOS.map((raio) => <Chip key={raio} ativo={raioKm === raio} texto={`${raio} km`}
                                        onPress={() => setRaioKm(raio)} desabilitado={!posicao} />)}
                                </View>
                            </View>
                        ) : null}

                        {selecionada ? (
                            <View style={styles.selecaoAtual}>
                                <Ionicons name="checkmark-circle" size={20} color="#48C78E" />
                                <Text style={styles.selecaoTexto} numberOfLines={1}>Selecionada: {selecionada.nome}</Text>
                            </View>
                        ) : null}
                        <Text style={styles.contagem}>{carregando ? 'Buscando...' : `${resultados.length} barbearia${resultados.length === 1 ? '' : 's'} encontrada${resultados.length === 1 ? '' : 's'}`}</Text>
                        {erro ? <EstadoErro mensagem={erro} tentarNovamente={carregar} /> : null}
                        {carregando ? <Carregando mensagem="Buscando barbearias..." /> : null}
                    </View>
                }
                renderItem={({ item }) => <CartaoBarbearia barbearia={item} selecionada={selecionada?.id === item.id}
                    abrir={() => abrirPerfil(item.slug)} />}
                ListEmptyComponent={!carregando && !erro ? <EstadoVazio titulo="Nenhuma barbearia encontrada"
                    descricao="Tente ampliar a distância ou alterar os filtros." /> : null}
            />
        </SafeAreaView>
    )
}

function CartaoBarbearia({ barbearia, selecionada, abrir }: { barbearia: BarbeariaResumo; selecionada: boolean; abrir: () => void }) {
    const endereco = [barbearia.endereco?.bairro, barbearia.endereco?.cidade, barbearia.endereco?.estado].filter(Boolean).join(' · ')
    const imagemRemota = barbearia.imagemCapaURL?.startsWith('http') ? { uri: barbearia.imagemCapaURL } : require('@/assets/images/inicio/fundo.png')
    return (
        <Pressable style={({ pressed }) => [styles.cartao, pressed && styles.cartaoPressionado]} onPress={abrir}>
            <ImageBackground source={imagemRemota} style={styles.capa} imageStyle={styles.capaImagem}>
                <View style={styles.capaOverlay}>
                    {barbearia.destaque ? <Text style={styles.destaque}>DESTAQUE</Text> : <View />}
                    <Text style={[styles.status, barbearia.statusOperacional?.status === 'ABERTA' && styles.statusAberta]}>
                        {barbearia.statusOperacional?.label ?? 'Status indisponível'}
                    </Text>
                </View>
            </ImageBackground>
            <View style={styles.cartaoConteudo}>
                <View style={styles.cartaoTituloLinha}>
                    <Text style={styles.cartaoTitulo}>{barbearia.nome}</Text>
                    {selecionada ? <Ionicons name="checkmark-circle" size={23} color="#48C78E" /> : null}
                </View>
                <Text style={styles.endereco}>{endereco || 'Localização em atualização'}</Text>
                <View style={styles.metricas}>
                    {barbearia.avaliacaoMedia != null ? <Text style={styles.metrica}>★ {barbearia.avaliacaoMedia} ({barbearia.quantidadeAvaliacoes})</Text> : null}
                    {barbearia.distanciaKm != null ? <Text style={styles.metrica}>⌖ {barbearia.distanciaKm} km</Text> : null}
                </View>
                <Text style={styles.resumo} numberOfLines={2}>{barbearia.descricao || 'Conheça os serviços e profissionais desta barbearia.'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicosChips}>
                    {barbearia.servicos.slice(0, 4).map((servico) => <Text key={servico.id} style={styles.servicoChip}>{servico.nome}</Text>)}
                </ScrollView>
                <Text style={styles.verPerfil}>Ver perfil completo →</Text>
            </View>
        </Pressable>
    )
}

function Chip({ texto, ativo, onPress, desabilitado = false }: { texto: string; ativo: boolean; onPress: () => void; desabilitado?: boolean }) {
    return <Pressable onPress={onPress} disabled={desabilitado} style={[styles.chip, ativo && styles.chipAtivo, desabilitado && styles.chipDesabilitado]}>
        <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{texto}</Text>
    </Pressable>
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' },
    lista: { padding: 18, paddingBottom: 36 },
    sobretitulo: { color: '#E7B84B', fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginTop: 6 },
    titulo: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', lineHeight: 35, marginTop: 8 },
    descricao: { color: '#AEBBCE', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
    busca: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 14 },
    buscaInput: { flex: 1, minHeight: 52, color: '#101828', fontSize: 16 },
    acoesBusca: { flexDirection: 'row', gap: 10, marginTop: 10 },
    botaoSecundario: { flex: 1, minHeight: 43, borderWidth: 1, borderColor: '#35435A', borderRadius: 11, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
    botaoSecundarioTexto: { color: '#E7EAF0', fontSize: 13, fontWeight: '700' },
    filtros: { backgroundColor: '#101E33', borderRadius: 14, padding: 14, gap: 12, marginTop: 12 },
    filtroInput: { minHeight: 46, borderRadius: 10, backgroundColor: '#17263D', color: '#FFFFFF', paddingHorizontal: 13, borderWidth: 1, borderColor: '#31415A' },
    linhaFiltro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    filtroLabel: { color: '#CDD5E1', fontSize: 13, fontWeight: '700' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderRadius: 999, borderWidth: 1, borderColor: '#43516A', paddingHorizontal: 12, paddingVertical: 8 },
    chipAtivo: { backgroundColor: '#E7B84B', borderColor: '#E7B84B' },
    chipDesabilitado: { opacity: 0.4 },
    chipTexto: { color: '#CDD5E1', fontSize: 12, fontWeight: '700' },
    chipTextoAtivo: { color: '#081426' },
    selecaoAtual: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#12352E', padding: 12, borderRadius: 11, marginTop: 16 },
    selecaoTexto: { flex: 1, color: '#C6F5DF', fontSize: 13, fontWeight: '700' },
    contagem: { color: '#AEBBCE', fontSize: 13, marginVertical: 18 },
    cartao: { overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 16 },
    cartaoPressionado: { opacity: 0.9, transform: [{ scale: 0.995 }] },
    capa: { height: 150 },
    capaImagem: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
    capaOverlay: { flex: 1, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: 'rgba(4,10,19,.35)' },
    destaque: { backgroundColor: '#E7B84B', color: '#081426', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, fontSize: 10, fontWeight: '900' },
    status: { backgroundColor: '#344054', color: '#FFFFFF', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, fontSize: 10, fontWeight: '800' },
    statusAberta: { backgroundColor: '#178558' },
    cartaoConteudo: { padding: 16 },
    cartaoTituloLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    cartaoTitulo: { flex: 1, color: '#101828', fontSize: 20, fontWeight: '900' },
    endereco: { color: '#667085', fontSize: 13, marginTop: 5 },
    metricas: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 12 },
    metrica: { color: '#7A5A10', backgroundColor: '#FFF7DF', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, fontSize: 12, fontWeight: '700' },
    resumo: { color: '#475467', fontSize: 14, lineHeight: 20, marginTop: 12 },
    servicosChips: { gap: 7, marginTop: 12 },
    servicoChip: { color: '#344054', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11 },
    verPerfil: { color: '#0A4B78', fontWeight: '800', fontSize: 14, marginTop: 15 },
})
