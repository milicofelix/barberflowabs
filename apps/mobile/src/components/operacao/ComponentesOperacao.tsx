import type { PermissaoEquipe, SecaoOperacao } from '@/src/data/operacao/tipos'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

const SECOES: Array<{ id: SecaoOperacao; nome: string; permissao: PermissaoEquipe }> = [
    { id: 'RESUMO', nome: 'Resumo', permissao: 'AGENDA_GERENCIAR' }, { id: 'AGENDA', nome: 'Agenda', permissao: 'AGENDA_GERENCIAR' },
    { id: 'EQUIPE', nome: 'Equipe', permissao: 'EQUIPE_GERENCIAR' }, { id: 'FINANCEIRO', nome: 'Financeiro', permissao: 'FINANCEIRO_VISUALIZAR' },
    { id: 'CAPACIDADE', nome: 'Recursos', permissao: 'RECURSOS_GERENCIAR' },
]

export function SeletorOperacao({ atual, selecionar, permissoes }: { atual: SecaoOperacao; selecionar: (secao: SecaoOperacao) => void; permissoes: PermissaoEquipe[] }) {
    const { cores } = useTema()
    return <View style={[styles.seletor, { backgroundColor: cores.superficie }]}>{SECOES.filter((secao) => permissoes.includes(secao.permissao)).map((secao) => <Pressable key={secao.id} onPress={() => selecionar(secao.id)}
        style={[styles.aba, atual === secao.id && { backgroundColor: cores.destaque }]}><Text style={[styles.abaTexto, { color: atual === secao.id ? cores.destaqueTexto : cores.textoSecundario }]}>{secao.nome}</Text></Pressable>)}</View>
}

export function CartaoMetrica({ titulo, valor, destaque }: { titulo: string; valor: string | number; destaque?: boolean }) {
    const { cores } = useTema()
    return <View style={[styles.metrica, { backgroundColor: cores.superficie, borderColor: destaque ? cores.destaque : cores.borda }]}><Text style={[styles.metricaTitulo, { color: cores.textoSecundario }]}>{titulo}</Text>
        <Text style={[styles.metricaValor, { color: destaque ? cores.destaque : cores.texto }]}>{valor}</Text></View>
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
