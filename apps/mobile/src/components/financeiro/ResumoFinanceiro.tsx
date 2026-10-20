import useTema from '@/src/data/contexts/ContextoTema'
import { moeda, totaisDoResumo } from '@/src/data/financeiro/formatacao'
import type { ResumoFinanceiro as Resumo } from '@/src/data/financeiro/tipos'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

export default function ResumoFinanceiro({ resumo }: { resumo: Resumo | null }) {
    const { cores } = useTema()
    const totais = totaisDoResumo(resumo)

    return <View style={styles.container}>
        <Secao titulo="Receitas">
            <Indicador titulo="Recebido" valor={moeda(totais.recebido)} cor={cores.sucesso} />
            <Indicador titulo="A receber" valor={moeda(totais.aReceber)} cor={cores.destaque} />
        </Secao>
        <Secao titulo="Despesas e obrigações">
            <Indicador titulo="Pago" valor={moeda(totais.pago)} cor={cores.perigo} />
            <Indicador titulo="A pagar" valor={moeda(totais.aPagar)} cor={cores.destaque} />
            <Indicador titulo="Repasses pendentes" valor={moeda(totais.repassesPendentes)}
                detalhe={`${totais.quantidadeRepasses} repasse(s)`} cor={cores.destaque} />
        </Secao>
        {totais.quantidadeDivergencias > 0 ? <View style={[styles.alerta, { backgroundColor: cores.superficie, borderColor: cores.perigo }]}>
            <Text style={[styles.alertaTitulo, { color: cores.perigo }]}>Conciliação com divergência</Text>
            <Text style={[styles.alertaTexto, { color: cores.texto }]}>{totais.quantidadeDivergencias} registro(s) · diferença de {moeda(totais.divergenciaConciliacao)}</Text>
        </View> : <View style={[styles.alerta, { backgroundColor: cores.superficie, borderColor: cores.sucesso }]}>
            <Text style={[styles.alertaTitulo, { color: cores.sucesso }]}>Conciliação sem divergências</Text>
            <Text style={[styles.alertaTexto, { color: cores.textoSecundario }]}>Nenhuma pendência encontrada no período.</Text>
        </View>}
    </View>

}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
    const { cores } = useTema()
    return <View style={styles.secao}><Text style={[styles.secaoTitulo, { color: cores.texto }]}>{titulo}</Text><View style={styles.grade}>{children}</View></View>
}

function Indicador({ titulo, valor, detalhe, cor }: { titulo: string; valor: string; detalhe?: string; cor: string }) {
    const { cores } = useTema()
    return <View style={[styles.indicador, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <View style={[styles.marca, { backgroundColor: cor }]} /><Text style={[styles.indicadorTitulo, { color: cores.textoSecundario }]}>{titulo}</Text>
        <Text style={[styles.valor, { color: cores.texto }]}>{valor}</Text>{detalhe ? <Text style={[styles.detalhe, { color: cores.textoSecundario }]}>{detalhe}</Text> : null}
    </View>
}

const styles = StyleSheet.create({
    container: { gap: 18 }, secao: { gap: 9 }, secaoTitulo: { fontSize: 17, fontWeight: '900' }, grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    indicador: { position: 'relative', width: '48%', minHeight: 108, overflow: 'hidden', borderWidth: 1, borderRadius: 14, padding: 14 },
    marca: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 4 }, indicadorTitulo: { fontSize: 13, fontWeight: '700' },
    valor: { marginTop: 9, fontSize: 20, fontWeight: '900' }, detalhe: { marginTop: 5, fontSize: 12 },
    alerta: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 5 }, alertaTitulo: { fontSize: 15, fontWeight: '900' }, alertaTexto: { lineHeight: 19 },
})
