import useTema from '@/src/data/contexts/ContextoTema'
import { periodoHoje, periodoMes, periodoSemana } from '@/src/data/financeiro/formatacao'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

interface Props {
    inicio: string
    fim: string
    selecionar: (inicio: string, fim: string) => void
}

export default function PeriodoFinanceiro({ inicio, fim, selecionar }: Props) {
    const { cores } = useTema()
    const atalhos = [
        { nome: 'Hoje', periodo: periodoHoje },
        { nome: 'Semana', periodo: periodoSemana },
        { nome: 'Mês', periodo: periodoMes },
    ]

    return <View style={[styles.container, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <View style={styles.atalhos}>{atalhos.map((atalho) => <Pressable key={atalho.nome}
            style={[styles.atalho, { borderColor: cores.borda, backgroundColor: cores.superficieElevada }]}
            onPress={() => { const periodo = atalho.periodo(); selecionar(periodo.inicio, periodo.fim) }}>
            <Text style={[styles.atalhoTexto, { color: cores.texto }]}>{atalho.nome}</Text>
        </Pressable>)}</View>
        <View style={styles.campos}>
            <CampoData label="Início" valor={inicio} concluir={(valor) => selecionar(valor, fim)} />
            <CampoData label="Fim" valor={fim} concluir={(valor) => selecionar(inicio, valor)} />
        </View>
    </View>
}

function CampoData({ label, valor, concluir }: { label: string; valor: string; concluir: (valor: string) => void }) {
    const { cores } = useTema()
    return <View style={styles.campo}><Text style={[styles.rotulo, { color: cores.textoSecundario }]}>{label}</Text><TextInput
        key={valor} defaultValue={valor} onEndEditing={(evento) => concluir(evento.nativeEvent.text)} returnKeyType="done"
        placeholder="AAAA-MM-DD" placeholderTextColor={cores.textoSecundario}
        style={[styles.input, { backgroundColor: cores.campo, borderColor: cores.borda, color: cores.campoTexto }]}
    /></View>
}

const styles = StyleSheet.create({
    container: { gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 }, atalhos: { flexDirection: 'row', gap: 8 },
    atalho: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 9 },
    atalhoTexto: { fontSize: 12, fontWeight: '800' }, campos: { flexDirection: 'row', gap: 10 }, campo: { flex: 1, gap: 5 },
    rotulo: { fontSize: 12, fontWeight: '700' }, input: { borderWidth: 1, borderRadius: 10, padding: 11 },
})
