import type { SecaoOperacao } from '@/src/data/operacao/tipos'
import { Pressable, StyleSheet, Text, View } from 'react-native'

const SECOES: Array<{ id: SecaoOperacao; nome: string }> = [
    { id: 'RESUMO', nome: 'Resumo' }, { id: 'AGENDA', nome: 'Agenda' },
    { id: 'EQUIPE', nome: 'Equipe' }, { id: 'FINANCEIRO', nome: 'Financeiro' },
]

export function SeletorOperacao({ atual, selecionar }: { atual: SecaoOperacao; selecionar: (secao: SecaoOperacao) => void }) {
    return <View style={styles.seletor}>{SECOES.map((secao) => <Pressable key={secao.id} onPress={() => selecionar(secao.id)}
        style={[styles.aba, atual === secao.id && styles.abaAtiva]}><Text style={[styles.abaTexto, atual === secao.id && styles.abaTextoAtivo]}>{secao.nome}</Text></Pressable>)}</View>
}

export function CartaoMetrica({ titulo, valor, destaque }: { titulo: string; valor: string | number; destaque?: boolean }) {
    return <View style={[styles.metrica, destaque && styles.metricaDestaque]}><Text style={styles.metricaTitulo}>{titulo}</Text>
        <Text style={[styles.metricaValor, destaque && styles.valorDestaque]}>{valor}</Text></View>
}

export const moeda = (valor: number) => Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const styles = StyleSheet.create({
    seletor: { flexDirection: 'row', backgroundColor: '#101E33', borderRadius: 12, padding: 4, marginVertical: 16 },
    aba: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 }, abaAtiva: { backgroundColor: '#E7B84B' },
    abaTexto: { color: '#AEBBCE', fontSize: 11, fontWeight: '800' }, abaTextoAtivo: { color: '#081426' },
    metrica: { flex: 1, minWidth: '46%', backgroundColor: '#101E33', borderRadius: 14, padding: 15, borderWidth: 1, borderColor: '#26364E' },
    metricaDestaque: { borderColor: '#92701E' }, metricaTitulo: { color: '#AEBBCE', fontSize: 12 },
    metricaValor: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 6 }, valorDestaque: { color: '#E7B84B' },
})
