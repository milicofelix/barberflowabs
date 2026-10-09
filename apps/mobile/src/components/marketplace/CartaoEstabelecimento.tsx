import type { EstabelecimentoResumo } from '@/src/data/barbearias/tipos'
import { Ionicons } from '@expo/vector-icons'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

export default function CartaoEstabelecimento({ item, selecionado, abrir }: {
    item: EstabelecimentoResumo; selecionado: boolean; abrir: () => void
}) {
    const { cores } = useTema()
    const endereco = [item.endereco.bairro, item.endereco.cidade, item.endereco.estado].filter(Boolean).join(' · ')
    const imagem = item.imagemCapaURL?.startsWith('http') ? { uri: item.imagemCapaURL } : require('@/assets/images/inicio/fundo.png')
    return <Pressable style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]} onPress={abrir}>
        <ImageBackground source={imagem} style={styles.capa} imageStyle={styles.capaImagem}>
            <View style={styles.overlay}><Text style={styles.categoria}>{item.segmentos?.[0]?.nome ?? 'Beleza e bem-estar'}</Text>
                <Text style={[styles.status, item.statusOperacional.status === 'ABERTA' && styles.aberta]}>{item.statusOperacional.label}</Text></View>
        </ImageBackground>
        <View style={styles.conteudo}>
            <View style={styles.tituloLinha}><Text style={[styles.titulo, { color: cores.texto }]}>{item.nome}</Text>
                {selecionado ? <Ionicons name="checkmark-circle" size={23} color="#48C78E" /> : null}</View>
            <Text style={[styles.endereco, { color: cores.textoSecundario }]}>{endereco || 'Localização em atualização'}</Text>
            <Text style={styles.meta}>{item.avaliacaoMedia ? `★ ${item.avaliacaoMedia}` : 'Novo'}
                {item.distanciaKm != null ? `  ·  ${item.distanciaKm} km` : ''}
                {item.precoInicial != null ? `  ·  a partir de ${moeda(item.precoInicial)}` : ''}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {item.especialidades?.slice(0, 4).map((e) => <Text key={e.id} style={[styles.chip, { color: cores.texto, borderColor: cores.borda }]}>{e.nome}</Text>)}
            </ScrollView>
            <Text style={styles.acao}>Ver perfil e agendar →</Text>
        </View>
    </Pressable>
}

const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const styles = StyleSheet.create({
    cartao: { overflow: 'hidden', backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 16, borderWidth: 1 },
    capa: { height: 145 }, capaImagem: { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
    overlay: { flex: 1, padding: 12, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(4,10,19,.35)' },
    categoria: { alignSelf: 'flex-start', backgroundColor: '#E7B84B', color: '#081426', padding: 7, borderRadius: 7, fontSize: 10, fontWeight: '900' },
    status: { alignSelf: 'flex-start', backgroundColor: '#344054', color: '#FFF', padding: 7, borderRadius: 7, fontSize: 10, fontWeight: '800' },
    aberta: { backgroundColor: '#178558' }, conteudo: { padding: 16 },
    tituloLinha: { flexDirection: 'row', gap: 8, alignItems: 'center' }, titulo: { flex: 1, color: '#101828', fontSize: 20, fontWeight: '900' },
    endereco: { color: '#667085', fontSize: 13, marginTop: 5 }, meta: { color: '#7A5A10', fontWeight: '700', marginTop: 10 },
    chips: { gap: 7, marginTop: 12 }, chip: { color: '#344054', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11 },
    acao: { color: '#0A4B78', fontWeight: '800', marginTop: 15 },
})
