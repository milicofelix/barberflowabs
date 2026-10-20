import CampoTexto from '@/src/components/shared/CampoTexto'
import useTema from '@/src/data/contexts/ContextoTema'
import { moeda, periodoHoje } from '@/src/data/financeiro/formatacao'
import type { ContaFinanceira, FormaPagamento } from '@/src/data/financeiro/tipos'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Props {
    conta: ContaFinanceira
    formas: FormaPagamento[]
    executando: boolean
    fechar: () => void
    salvar: (dados: { valorPago: number; pagoEm: string; formaPagamentoId?: number }) => Promise<void>
}

export default function FormularioBaixaConta({ conta, formas, executando, fechar, salvar }: Props) {
    const { cores } = useTema()
    const saldo = Number(conta.valorOriginal) - Number(conta.valorPago)
    const [valor, setValor] = useState(String(saldo))
    const [pagoEm, setPagoEm] = useState(periodoHoje().inicio)
    const [formaId, setFormaId] = useState<number | undefined>(formas[0]?.id)
    const numero = Number(valor.replace(',', '.'))
    const invalido = !Number.isFinite(numero) || numero <= 0 || numero > saldo

    return <View style={[styles.formulario, { backgroundColor: cores.superficie, borderColor: cores.destaque }]}>
        <Text style={[styles.nome, { color: cores.texto }]}>Baixa de {conta.descricao}</Text>
        <Text style={[styles.meta, { color: cores.textoSecundario }]}>Saldo disponível: {moeda(saldo)}</Text>
        <CampoTexto label="Valor pago" value={valor} onChangeText={setValor} keyboardType="decimal-pad" error={invalido ? 'O valor deve estar dentro do saldo.' : undefined} />
        <CampoTexto label="Data do pagamento" value={pagoEm} onChangeText={setPagoEm} />
        <Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Forma de pagamento</Text>
        <View style={styles.chips}>{formas.map((forma) => <Pressable key={forma.id} onPress={() => setFormaId(forma.id)}
            style={[styles.chip, { borderColor: formaId === forma.id ? cores.destaque : cores.borda }]}><Text style={{ color: cores.texto, fontWeight: '700' }}>{forma.nome}</Text></Pressable>)}</View>
        <View style={styles.acoes}><Pressable onPress={fechar} style={[styles.acao, { borderColor: cores.borda }]}><Text style={{ color: cores.texto }}>Voltar</Text></Pressable>
            <Pressable disabled={invalido || executando} onPress={() => salvar({ valorPago: numero, pagoEm, formaPagamentoId: formaId })}
                style={[styles.botao, { backgroundColor: cores.destaque }, (invalido || executando) && { opacity: 0.5 }]}>
                <Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{executando ? 'Salvando...' : 'Confirmar baixa'}</Text>
            </Pressable></View>
    </View>
}

const styles = StyleSheet.create({
    formulario: { borderWidth: 1, borderRadius: 14, padding: 15, marginTop: 5 }, nome: { fontSize: 16, fontWeight: '900' },
    meta: { marginVertical: 6, fontSize: 13 }, rotulo: { fontSize: 12, fontWeight: '800' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 },
    chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 }, acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    acao: { minHeight: 42, justifyContent: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 13 },
    botao: { minHeight: 42, justifyContent: 'center', borderRadius: 10, paddingHorizontal: 14 },
})
