import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, DeviceEventEmitter, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { StackParamList } from '@/src/navigation/types'
import { EVENTO_ATENDIMENTOS } from '@/src/data/hooks/useSincronizacaoAtendimentos'
import { perfilOperacional, resolverPerfil } from '@/src/data/auth/perfis'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import useSessao from '@/src/data/hooks/useSessao'

interface Notificacao { id: number; tipo: string; titulo: string; mensagem: string; lidaEm?: string | null; acaoUrl?: string | null }
const INTERVALO_ATUALIZACAO_MS = 5_000

export default function SinoNotificacoes() {
    const { cores } = useTema(); const { httpGet, httpPut } = useAPI()
    const { usuario, renovarSessao } = useSessao()
    const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
    const requisicao = useRef(0)
    const [aberto, setAberto] = useState(false); const [itens, setItens] = useState<Notificacao[]>([]); const [erro, setErro] = useState('')
    const carregar = useCallback(async () => {
        const ticket = ++requisicao.current
        if (!usuario) return
        try {
            const notificacoes = await httpGet<Notificacao[]>('/notificacoes', { escopoTenant: 'nenhum' })
            if (ticket !== requisicao.current) return
            setItens(notificacoes); setErro('')
            const responsavel = usuario?.papel === 'ESTABLISHMENT_OWNER' || usuario?.role === 'ESTABLISHMENT_OWNER'
            if (!responsavel && notificacoes.some((item) => !item.lidaEm && item.tipo === 'SOLICITACAO_APPROVED')) await renovarSessao()
        }
        catch (e) { if (ticket === requisicao.current) setErro(mensagemDoErro(e)) }
    }, [httpGet, renovarSessao, usuario])
    useEffect(() => {
        void carregar()
        const intervalo = setInterval(() => { if (AppState.currentState === 'active') void carregar() }, INTERVALO_ATUALIZACAO_MS)
        const assinatura = AppState.addEventListener('change', (estado) => { if (estado === 'active') carregar() })
        const evento = DeviceEventEmitter.addListener(EVENTO_ATENDIMENTOS, () => { void carregar() })
        return () => { requisicao.current++; clearInterval(intervalo); assinatura.remove(); evento.remove() }
    }, [carregar])
    useEffect(() => { setItens([]); setAberto(false); setErro('') }, [usuario?.id])
    async function ler(item: Notificacao) {
        try {
            if (!item.lidaEm) await httpPut(`/notificacoes/${item.id}/ler`, {}, { escopoTenant: 'nenhum' })
            const url = item.acaoUrl
            if (url?.startsWith('/gestao?') && !url.includes('\\') && perfilOperacional(resolverPerfil(usuario))) {
                const parametros = new URLSearchParams(url.slice(url.indexOf('?') + 1))
                const id = Number(parametros.get('agendamentoId'))
                if (Number.isSafeInteger(id) && id > 0) {
                    setAberto(false)
                    navigation.navigate('Abas', { screen: 'Operacao', params: { agendamentoId: id, chave: Date.now() } })
                }
            }
            await carregar()
        } catch (e) { setErro(mensagemDoErro(e)) }
    }
    async function lerTodas() {
        try { await httpPut('/notificacoes/ler-todas', {}, { escopoTenant: 'nenhum' }); await carregar() }
        catch (e) { setErro(mensagemDoErro(e)) }
    }
    const total = itens.filter(item => !item.lidaEm).length
    return <><Pressable accessibilityLabel="Notificações" onPress={() => { setAberto(true); carregar() }} style={[styles.sino, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <Ionicons name="notifications-outline" size={22} color={cores.texto} />{total ? <Text style={styles.contador}>{total}</Text> : null}
    </Pressable><Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}><View style={styles.fundo}><View style={[styles.painel, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <View style={styles.topo}><Text style={[styles.titulo, { color: cores.texto }]}>Notificações</Text><Pressable onPress={() => setAberto(false)}><Ionicons name="close" size={25} color={cores.texto} /></Pressable></View>
        <Pressable onPress={lerTodas}><Text style={styles.lerTodas}>Marcar todas como lidas</Text></Pressable>
        <ScrollView>{erro ? <Text style={styles.erro}>{erro}</Text> : null}{itens.length ? itens.map(item => <Pressable key={item.id} onPress={() => ler(item)} style={[styles.item, { borderColor: cores.borda }, !item.lidaEm && styles.naoLida]}><Text style={[styles.nome, { color: cores.texto }]}>{item.titulo}</Text><Text style={{ color: cores.textoSecundario }}>{item.mensagem}</Text></Pressable>) : <Text style={[styles.vazio, { color: cores.textoSecundario }]}>Nenhuma notificação.</Text>}</ScrollView>
    </View></View></Modal></>
}
const styles = StyleSheet.create({ sino: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, contador: { position: 'absolute', top: -3, right: -3, color: '#FFF', backgroundColor: '#D946EF', borderRadius: 10, minWidth: 20, textAlign: 'center', fontSize: 11, fontWeight: '900', padding: 2 }, fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,.55)', justifyContent: 'center', padding: 18 }, painel: { maxHeight: '75%', borderWidth: 1, borderRadius: 18, padding: 16 }, topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, titulo: { fontSize: 21, fontWeight: '900' }, lerTodas: { color: '#6366F1', fontWeight: '700', marginVertical: 14 }, item: { borderWidth: 1, borderRadius: 12, padding: 13, marginBottom: 8 }, naoLida: { backgroundColor: 'rgba(99,102,241,.14)' }, nome: { fontWeight: '900', marginBottom: 4 }, vazio: { textAlign: 'center', padding: 25 }, erro: { color: '#EF4444', marginBottom: 10 } })
