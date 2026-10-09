import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useAdministracao from '@/src/data/hooks/useAdministracao'
import type { EstabelecimentoAdmin } from '@/src/data/hooks/useAdministracao'
import type { ReactNode } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'

export default function Administracao() {
    const { cores } = useTema()
    const dados = useAdministracao()
    return <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['top']}><ScrollView contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={dados.carregando} onRefresh={dados.carregar} tintColor="#E7B84B" />}>
        <Text style={styles.sobretitulo}>ADMINISTRAÇÃO UNIFLOW ABS</Text><Text style={[styles.titulo, { color: cores.texto }]}>Plataforma</Text>
        <View style={styles.metricas}><Metrica titulo="Estabelecimentos" valor={dados.estabelecimentos.length} />
            <Metrica titulo="Aguardando revisão" valor={dados.pendentes.length} /></View>
        {dados.erro ? <EstadoErro mensagem={dados.erro} tentarNovamente={dados.carregar} /> : null}
        {dados.carregando && !dados.estabelecimentos.length ? <Carregando mensagem="Carregando plataforma..." /> : null}
        <Text style={[styles.secao, { color: cores.texto }]}>Pendências</Text>
        {!dados.carregando && !dados.pendentes.length ? <EstadoVazio titulo="Nenhuma revisão pendente" /> : null}
        {dados.pendentes.map((item) => <Cartao key={item.id} item={item} acoes={<View style={styles.acoes}>
            <Botao texto="Aprovar" acao={() => dados.revisar(item.id, 'aprovar')} /><Botao texto="Reprovar" perigo acao={() => dados.revisar(item.id, 'reprovar')} />
        </View>} />)}
        <Text style={[styles.secao, { color: cores.texto }]}>Todos os estabelecimentos</Text>
        {dados.estabelecimentos.map((item) => <Cartao key={item.id} item={item} />)}
    </ScrollView></SafeAreaView>
}

function Cartao({ item, acoes }: { item: EstabelecimentoAdmin; acoes?: ReactNode }) {
    const { cores } = useTema()
    return <View style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.nome, { color: cores.texto }]}>{item.nome}</Text><Text style={[styles.meta, { color: cores.textoSecundario }]}>{item.tipoEstabelecimento ?? 'ESTABELECIMENTO'} · {item.status} · {item.reviewStatus}</Text>
        <Text style={[styles.detalhe, { color: cores.texto }]}>{item._count?.profissionais ?? 0} profissionais · {item._count?.servicos ?? 0} serviços · {item._count?.agendamentos ?? 0} agendamentos</Text>{acoes}</View>
}
function Metrica({ titulo, valor }: { titulo: string; valor: number }) { const { cores } = useTema(); return <View style={[styles.metrica, { backgroundColor: cores.superficie }]}><Text style={[styles.meta, { color: cores.textoSecundario }]}>{titulo}</Text><Text style={styles.numero}>{valor}</Text></View> }
function Botao({ texto, acao, perigo }: { texto: string; acao: () => void; perigo?: boolean }) { return <Pressable onPress={acao} style={[styles.botao, perigo && styles.botaoPerigo]}><Text style={styles.botaoTexto}>{texto}</Text></Pressable> }
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' }, conteudo: { padding: 18, paddingBottom: 42 }, sobretitulo: { color: '#E7B84B', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, titulo: { color: '#FFF', fontSize: 29, fontWeight: '900', marginTop: 6 },
    metricas: { flexDirection: 'row', gap: 10, marginVertical: 16 }, metrica: { flex: 1, backgroundColor: '#101E33', borderRadius: 13, padding: 14 }, numero: { color: '#E7B84B', fontSize: 26, fontWeight: '900', marginTop: 5 },
    secao: { color: '#FFF', fontSize: 20, fontWeight: '900', marginTop: 22, marginBottom: 10 }, cartao: { backgroundColor: '#101E33', borderRadius: 13, borderWidth: 1, borderColor: '#26364E', padding: 14, marginBottom: 9 }, nome: { color: '#FFF', fontSize: 16, fontWeight: '900' }, meta: { color: '#AEBBCE', fontSize: 12, marginTop: 5 }, detalhe: { color: '#D5DCE7', marginTop: 8 },
    acoes: { flexDirection: 'row', gap: 8, marginTop: 12 }, botao: { flex: 1, backgroundColor: '#178558', borderRadius: 9, padding: 10, alignItems: 'center' }, botaoPerigo: { backgroundColor: '#B42318' }, botaoTexto: { color: '#FFF', fontWeight: '900' },
})
