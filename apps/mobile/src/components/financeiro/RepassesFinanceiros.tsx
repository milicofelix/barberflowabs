import Confirmacao from '@/src/components/shared/Confirmacao'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useTema from '@/src/data/contexts/ContextoTema'
import { data, moeda } from '@/src/data/financeiro/formatacao'
import type { RepasseFinanceiro } from '@/src/data/financeiro/tipos'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Props {
    repasses: RepasseFinanceiro[]; inicio: string; fim: string; podeGerenciar: boolean; executando: boolean
    calcular: () => Promise<boolean>; pagar: (id: number) => Promise<boolean>
}

export default function RepassesFinanceiros({ repasses, inicio, fim, podeGerenciar, executando, calcular, pagar }: Props) {
    const { cores } = useTema()
    const [selecionado, setSelecionado] = useState<RepasseFinanceiro | null>(null)

    async function confirmarPagamento() {
        if (!selecionado || executando) return
        if (await pagar(selecionado.id)) setSelecionado(null)
    }

    return <View style={styles.container}>
        <View style={[styles.periodo, { backgroundColor: cores.superficieElevada }]}><Text style={{ color: cores.textoSecundario }}>Período: {data(inicio)} a {data(fim)}</Text></View>
        {podeGerenciar ? <Pressable disabled={executando} onPress={calcular} style={[styles.botao, { backgroundColor: cores.destaque }, executando && styles.desabilitado]}>
            <Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{executando ? 'Calculando...' : 'Calcular repasses do período'}</Text></Pressable> : null}
        <Text style={[styles.titulo, { color: cores.texto }]}>Repasses</Text>
        {!repasses.length ? <EstadoVazio titulo="Nenhum repasse no período" /> : repasses.map((repasse) => <View key={repasse.id} style={[styles.item, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.linha}><Text style={[styles.nome, { color: cores.texto }]}>{repasse.profissional?.nome ?? `Profissional #${repasse.profissionalId}`}</Text>
                <Text style={{ color: repasse.status === 'PAGO' ? cores.sucesso : cores.destaque, fontWeight: '900' }}>{repasse.status}</Text></View>
            <Text style={[styles.meta, { color: cores.textoSecundario }]}>Receita bruta: {moeda(repasse.receitaBruta)} · média {Number(repasse.percentualMedio).toFixed(2)}%</Text>
            <Text style={[styles.meta, { color: cores.textoSecundario }]}>Comissão: {moeda(repasse.valorComissao)} · ajustes: {moeda(repasse.ajustes)}</Text>
            <Text style={[styles.valor, { color: cores.texto }]}>Líquido: {moeda(repasse.valorLiquido)}</Text>
            {repasse.pagoEm ? <Text style={[styles.meta, { color: cores.textoSecundario }]}>Pago em {data(repasse.pagoEm)}</Text> : null}
            {podeGerenciar && repasse.status === 'PENDENTE' ? <Pressable disabled={executando} onPress={() => setSelecionado(repasse)} style={[styles.acao, { borderColor: cores.sucesso }]}><Text style={{ color: cores.sucesso, fontWeight: '800' }}>Marcar como pago</Text></Pressable> : null}
        </View>)}
        <Confirmacao visivel={!!selecionado} titulo="Pagar repasse" mensagem={`Confirma o pagamento de ${moeda(selecionado?.valorLiquido)} para ${selecionado?.profissional?.nome ?? 'o profissional'}?`}
            confirmarLabel={executando ? 'Pagando...' : 'Confirmar pagamento'} onConfirmar={confirmarPagamento} onCancelar={() => setSelecionado(null)} />
    </View>
}

const styles = StyleSheet.create({
    container: { gap: 11 }, periodo: { borderRadius: 10, padding: 11 }, botao: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
    desabilitado: { opacity: 0.5 }, titulo: { fontSize: 18, fontWeight: '900', marginTop: 5 }, item: { borderWidth: 1, borderRadius: 13, padding: 14, gap: 5 },
    linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, nome: { flex: 1, fontSize: 15, fontWeight: '900' },
    meta: { fontSize: 12, lineHeight: 18 }, valor: { fontSize: 17, fontWeight: '900', marginTop: 3 }, acao: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9, marginTop: 5 },
})
