import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import Confirmacao from '@/src/components/shared/Confirmacao'
import useAdministracao from '@/src/data/hooks/useAdministracao'
import type { EstabelecimentoAdmin } from '@/src/data/hooks/useAdministracao'
import type { SolicitacaoAdmin } from '@/src/data/hooks/useAdministracao'
import { useState, type ReactNode } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'

export default function Administracao() {
    const { cores } = useTema()
    const dados = useAdministracao()
    const [confirmandoInadimplencia, setConfirmandoInadimplencia] = useState(false)
    async function processarInadimplencia() { await dados.processarInadimplencia(); setConfirmandoInadimplencia(false) }
    return <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['top']}><ScrollView contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={dados.carregando} onRefresh={dados.carregar} tintColor="#E7B84B" />}>
        <Text style={styles.sobretitulo}>ADMINISTRAÇÃO UNIFLOW ABS</Text><Text style={[styles.titulo, { color: cores.texto }]}>Plataforma</Text>
        <View style={styles.metricas}><Metrica titulo="Estabelecimentos" valor={dados.estabelecimentos.length} />
            <Metrica titulo="Aguardando revisão" valor={dados.pendentes.length} /></View>
        {dados.erro ? <EstadoErro mensagem={dados.erro} tentarNovamente={dados.carregar} /> : null}
        {dados.sucesso ? <FeedbackSucesso mensagem={dados.sucesso} /> : null}
        {dados.carregando && !dados.estabelecimentos.length ? <Carregando mensagem="Carregando plataforma..." /> : null}
        <View style={[styles.inadimplencia, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.inadimplenciaTexto}><Text style={[styles.nome, { color: cores.texto }]}>Inadimplência</Text><Text style={[styles.meta, { color: cores.textoSecundario }]}>Identifica cobranças vencidas e aplica o bloqueio definido pelo backend.</Text></View>
            <Pressable disabled={dados.executando} onPress={() => setConfirmandoInadimplencia(true)} style={[styles.processar, dados.executando && styles.desabilitado]}><Text style={styles.botaoTexto}>{dados.executando ? 'Processando...' : 'Processar'}</Text></Pressable>
        </View>
        <Text style={[styles.secao, { color: cores.texto }]}>Pendências</Text>
        {!dados.carregando && !dados.pendentes.length ? <EstadoVazio titulo="Nenhuma revisão pendente" /> : null}
        {dados.pendentes.map((item) => <CartaoSolicitacao key={item.id} item={item} revisar={dados.revisar} />)}
        <Text style={[styles.secao, { color: cores.texto }]}>Todos os estabelecimentos</Text>
        {dados.estabelecimentos.map((item) => <Cartao key={item.id} item={item} salvarCoordenadas={dados.salvarCoordenadas} />)}
        <Confirmacao visivel={confirmandoInadimplencia} titulo="Processar inadimplência" mensagem="Cobranças pendentes vencidas serão marcadas como atrasadas e os estabelecimentos correspondentes poderão ser bloqueados. Deseja continuar?"
            confirmarLabel={dados.executando ? 'Processando...' : 'Processar'} onConfirmar={processarInadimplencia} onCancelar={() => setConfirmandoInadimplencia(false)} />
    </ScrollView></SafeAreaView>
}

function Cartao({ item, acoes, salvarCoordenadas }: { item: EstabelecimentoAdmin; acoes?: ReactNode; salvarCoordenadas?: (id: number, latitude: number, longitude: number) => Promise<void> }) {
    const { cores } = useTema()
    const [latitude, setLatitude] = useState(item.latitude == null ? '' : String(item.latitude)); const [longitude, setLongitude] = useState(item.longitude == null ? '' : String(item.longitude))
    function salvar() { if (!latitude.trim() || !longitude.trim()) return; const lat = Number(latitude.replace(',', '.')); const lng = Number(longitude.replace(',', '.')); if (Number.isFinite(lat) && Number.isFinite(lng)) salvarCoordenadas?.(item.id, lat, lng) }
    return <View style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.nome, { color: cores.texto }]}>{item.nome}</Text><Text style={[styles.meta, { color: cores.textoSecundario }]}>{item.tipoEstabelecimento ?? 'ESTABELECIMENTO'} · {item.status} · {item.reviewStatus}</Text>
        <Text style={[styles.detalhe, { color: cores.texto }]}>{item._count?.profissionais ?? 0} profissionais · {item._count?.servicos ?? 0} serviços · {item._count?.agendamentos ?? 0} agendamentos</Text>
        {salvarCoordenadas ? <View style={styles.coordenadas}><TextInput value={latitude} onChangeText={setLatitude} placeholder="Latitude" keyboardType="numbers-and-punctuation" placeholderTextColor={cores.textoSecundario} style={[styles.coordenada, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} />
            <TextInput value={longitude} onChangeText={setLongitude} placeholder="Longitude" keyboardType="numbers-and-punctuation" placeholderTextColor={cores.textoSecundario} style={[styles.coordenada, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} />
            <Pressable onPress={salvar} style={styles.salvarCoordenadas}><Text style={styles.botaoTexto}>Salvar</Text></Pressable></View> : null}{acoes}</View>
}
function CartaoSolicitacao({ item, revisar }: { item: SolicitacaoAdmin; revisar: (id: number, decisao: 'aprovar' | 'solicitar-correcao' | 'reprovar', coordenadas?: { latitude: number; longitude: number }) => Promise<void> }) {
    const { cores } = useTema()
    const [latitude, setLatitude] = useState(''); const [longitude, setLongitude] = useState(''); const [erro, setErro] = useState('')
    function aprovar() {
        if (item.modeloAtendimento === 'DOMICILIAR') return revisar(item.id, 'aprovar')
        const lat = Number(latitude.replace(',', '.')); const lng = Number(longitude.replace(',', '.'))
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return setErro('Valide latitude e longitude antes de aprovar.')
        setErro(''); return revisar(item.id, 'aprovar', { latitude: lat, longitude: lng })
    }
    const endereco = [item.logradouro, item.numero, item.bairro, item.cidade, item.estado].filter(Boolean).join(' · ')
    return <View style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.nome, { color: cores.texto }]}>{item.nomePublico}</Text><Text style={[styles.meta, { color: cores.textoSecundario }]}>{item.tipoEstabelecimento} · {item.modeloAtendimento}</Text><Text style={[styles.detalhe, { color: cores.texto }]}>{item.usuario.nome} · {item.usuario.email}</Text>
        {endereco ? <Text style={[styles.detalhe, { color: cores.texto }]}>{endereco}</Text> : null}
        {item.modeloAtendimento !== 'DOMICILIAR' ? <><Text style={[styles.meta, { color: cores.textoSecundario }]}>Coordenadas validadas pelo superadmin</Text><View style={styles.coordenadas}>
            <TextInput value={latitude} onChangeText={setLatitude} placeholder="Latitude" keyboardType="numbers-and-punctuation" placeholderTextColor={cores.textoSecundario} style={[styles.coordenada, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} />
            <TextInput value={longitude} onChangeText={setLongitude} placeholder="Longitude" keyboardType="numbers-and-punctuation" placeholderTextColor={cores.textoSecundario} style={[styles.coordenada, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} /></View></> : null}
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}<View style={styles.acoes}><Botao texto="Aprovar" acao={aprovar} /><Botao texto="Corrigir" alerta acao={() => revisar(item.id, 'solicitar-correcao')} /><Botao texto="Reprovar" perigo acao={() => revisar(item.id, 'reprovar')} /></View></View>
}
function Metrica({ titulo, valor }: { titulo: string; valor: number }) { const { cores } = useTema(); return <View style={[styles.metrica, { backgroundColor: cores.superficie }]}><Text style={[styles.meta, { color: cores.textoSecundario }]}>{titulo}</Text><Text style={styles.numero}>{valor}</Text></View> }
function Botao({ texto, acao, perigo, alerta }: { texto: string; acao: () => void; perigo?: boolean; alerta?: boolean }) { return <Pressable onPress={acao} style={[styles.botao, alerta && styles.botaoAlerta, perigo && styles.botaoPerigo]}><Text style={styles.botaoTexto}>{texto}</Text></Pressable> }
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' }, conteudo: { padding: 18, paddingBottom: 42 }, sobretitulo: { color: '#E7B84B', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, titulo: { color: '#FFF', fontSize: 29, fontWeight: '900', marginTop: 6 },
    metricas: { flexDirection: 'row', gap: 10, marginVertical: 16 }, metrica: { flex: 1, backgroundColor: '#101E33', borderRadius: 13, padding: 14 }, numero: { color: '#E7B84B', fontSize: 26, fontWeight: '900', marginTop: 5 },
    secao: { color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 22, marginBottom: 10 }, cartao: { backgroundColor: '#101E33', borderRadius: 13, borderWidth: 1, borderColor: '#26364E', padding: 14, marginBottom: 9 }, nome: { color: '#FFF', fontSize: 16, fontWeight: '900' }, meta: { color: '#AEBBCE', fontSize: 12, marginTop: 5 }, detalhe: { color: '#D5DCE7', marginTop: 8 },
    inadimplencia: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 13, padding: 14, marginBottom: 4 }, inadimplenciaTexto: { flex: 1 }, processar: { backgroundColor: '#B42318', borderRadius: 9, paddingHorizontal: 13, paddingVertical: 11 },
    desabilitado: { opacity: 0.5 }, coordenadas: { flexDirection: 'row', gap: 8, marginTop: 8 }, coordenada: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10 }, salvarCoordenadas: { minHeight: 44, justifyContent: 'center', backgroundColor: '#2563EB', borderRadius: 9, paddingHorizontal: 11 }, erro: { color: '#DC2626', marginTop: 7 }, acoes: { flexDirection: 'row', gap: 6, marginTop: 12 }, botao: { flex: 1, backgroundColor: '#178558', borderRadius: 9, padding: 9, alignItems: 'center' }, botaoAlerta: { backgroundColor: '#B7791F' }, botaoPerigo: { backgroundColor: '#B42318' }, botaoTexto: { color: '#FFF', fontWeight: '900', fontSize: 12 },
})
