import EstadoErro from '@/src/components/shared/EstadoErro'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import type { AgendamentoOperacional } from '@/src/data/operacao/tipos'
import { useCallback, useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

export default function ProximosAgendamentos() {
    const { cores } = useTema()
    const { httpGet } = useAPI()
    const [itens, setItens] = useState<AgendamentoOperacional[]>([])
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const carregar = useCallback(async () => {
        try { setCarregando(true); setErro(null); setItens(await httpGet<AgendamentoOperacional[]>('/gestao/agendamentos/futuros')) }
        catch (error) { setErro(mensagemDoErro(error)) }
        finally { setCarregando(false) }
    }, [httpGet])
    useEffect(() => { carregar() }, [carregar])
    return <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}>
        <Text style={styles.sobretitulo}>SEU ESTABELECIMENTO</Text>
        <Text style={[styles.titulo, { color: cores.texto }]}>Próximos agendamentos</Text>
        <Text style={[styles.descricao, { color: cores.textoSecundario }]}>Acompanhe os próximos clientes em ordem de atendimento.</Text>
        {erro ? <EstadoErro mensagem={erro} tentarNovamente={carregar} /> : null}
        {!carregando && !erro && !itens.length ? <EstadoVazio titulo="Nenhum agendamento futuro" descricao="Novos horários aparecerão aqui assim que forem reservados." /> : null}
        {itens.map((item) => <View key={item.id} style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.linha}><View style={styles.textos}><Text style={[styles.nome, { color: cores.texto }]}>{item.usuario?.nome ?? 'Cliente'}</Text>
                <Text style={[styles.meta, { color: cores.textoSecundario }]}>{item.profissional?.nome ?? 'Profissional'} · {item.servicos?.map((servico) => servico.nome).join(', ')}</Text></View>
                <Text style={[styles.status, { color: cores.destaque }]}>{item.status}</Text></View>
            <Text style={[styles.data, { color: cores.texto }]}>{new Date(item.data).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
        </View>)}
    </ScrollView>
}

const styles = StyleSheet.create({
    conteudo: { padding: 18, paddingBottom: 40, gap: 12 }, sobretitulo: { color: '#E7B84B', fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
    titulo: { fontSize: 29, fontWeight: '900' }, descricao: { lineHeight: 20, marginBottom: 4 },
    cartao: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 9 }, linha: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    textos: { flex: 1 }, nome: { fontSize: 17, fontWeight: '900' }, meta: { marginTop: 4, lineHeight: 18 }, status: { fontSize: 11, fontWeight: '900' },
    data: { fontSize: 15, fontWeight: '800' },
})
