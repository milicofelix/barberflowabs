import CampoTexto from '@/src/components/shared/CampoTexto'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useTema from '@/src/data/contexts/ContextoTema'
import { dataHora, moeda } from '@/src/data/financeiro/formatacao'
import type { ConciliacaoFinanceira, ContaFinanceira } from '@/src/data/financeiro/tipos'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import SeletorBuscaFinanceiro from './SeletorBuscaFinanceiro'

interface Payload {
    contaFinanceiraId?: number; provedor: string; transacaoExternaId: string
    valorEsperado: number; valorRecebido: number; observacoes?: string
}

interface Props {
    conciliacoes: ConciliacaoFinanceira[]; contas: ContaFinanceira[]; podeGerenciar: boolean; executando: boolean
    salvar: (dados: Payload) => Promise<boolean>
}

const FORMULARIO_INICIAL = { contaFinanceiraId: null as number | null, provedor: 'MANUAL', transacaoExternaId: '', valorEsperado: '', valorRecebido: '', observacoes: '' }

export default function ConciliacoesFinanceiras({ conciliacoes, contas, podeGerenciar, executando, salvar }: Props) {
    const { cores } = useTema()
    const [form, setForm] = useState(FORMULARIO_INICIAL)
    const [tentouEnviar, setTentouEnviar] = useState(false)
    const esperado = numero(form.valorEsperado)
    const recebido = numero(form.valorRecebido)
    const contasSelecionaveis = useMemo(() => contas.map((conta) => ({ id: conta.id, nome: `#${conta.id} · ${conta.descricao}` })), [contas])
    const valido = !!form.provedor.trim() && !!form.transacaoExternaId.trim() && esperado >= 0 && recebido >= 0

    async function submeter() {
        setTentouEnviar(true)
        if (!valido || executando) return
        const sucesso = await salvar({
            contaFinanceiraId: form.contaFinanceiraId ?? undefined, provedor: form.provedor.trim(), transacaoExternaId: form.transacaoExternaId.trim(),
            valorEsperado: esperado, valorRecebido: recebido, observacoes: form.observacoes.trim() || undefined,
        })
        if (sucesso) { setForm(FORMULARIO_INICIAL); setTentouEnviar(false) }
    }

    return <View style={styles.container}>
        {podeGerenciar ? <View style={[styles.formulario, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <Text style={[styles.titulo, { color: cores.texto }]}>Nova conciliação</Text>
            <CampoTexto label="Provedor" value={form.provedor} onChangeText={(provedor) => setForm({ ...form, provedor })}
                autoCapitalize="characters" error={tentouEnviar && !form.provedor.trim() ? 'Informe o provedor.' : undefined} />
            <CampoTexto label="ID externo da transação" value={form.transacaoExternaId} onChangeText={(transacaoExternaId) => setForm({ ...form, transacaoExternaId })}
                autoCapitalize="none" error={tentouEnviar && !form.transacaoExternaId.trim() ? 'Informe o identificador da transação.' : undefined} />
            <SeletorBuscaFinanceiro label="Conta vinculada (opcional)" itens={contasSelecionaveis} selecionado={form.contaFinanceiraId}
                selecionar={(contaFinanceiraId) => setForm({ ...form, contaFinanceiraId })} />
            <View style={styles.valores}><View style={styles.flexivel}><CampoTexto label="Valor esperado" value={form.valorEsperado} keyboardType="decimal-pad"
                onChangeText={(valorEsperado) => setForm({ ...form, valorEsperado })} error={tentouEnviar && esperado < 0 ? 'Valor inválido.' : undefined} /></View>
                <View style={styles.flexivel}><CampoTexto label="Valor recebido" value={form.valorRecebido} keyboardType="decimal-pad"
                    onChangeText={(valorRecebido) => setForm({ ...form, valorRecebido })} error={tentouEnviar && recebido < 0 ? 'Valor inválido.' : undefined} /></View></View>
            <CampoTexto label="Observações (opcional)" value={form.observacoes} onChangeText={(observacoes) => setForm({ ...form, observacoes })} multiline />
            <Pressable disabled={!valido || executando} onPress={submeter} style={[styles.botao, { backgroundColor: cores.destaque }, (!valido || executando) && styles.desabilitado]}>
                <Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{executando ? 'Salvando...' : 'Registrar conciliação'}</Text>
            </Pressable>
        </View> : null}

        <Text style={[styles.titulo, { color: cores.texto }]}>Histórico de conciliações</Text>
        {!conciliacoes.length ? <EstadoVazio titulo="Nenhuma conciliação registrada" /> : conciliacoes.map((item) => <Conciliacao key={item.id} item={item} />)}
    </View>
}

function Conciliacao({ item }: { item: ConciliacaoFinanceira }) {
    const { cores } = useTema()
    const divergente = item.status === 'DIVERGENTE'
    const pendente = item.status === 'PENDENTE'
    const cor = divergente ? cores.perigo : pendente ? cores.destaque : cores.sucesso
    return <View style={[styles.item, { backgroundColor: cores.superficie, borderColor: cor }]}>
        <View style={styles.linha}><Text style={[styles.nome, { color: cores.texto }]}>{item.provedor} · {item.transacaoExternaId}</Text>
            <Text style={{ color: cor, fontSize: 11, fontWeight: '900' }}>{STATUS[item.status]}</Text></View>
        <Text style={[styles.meta, { color: cores.textoSecundario }]}>Esperado {moeda(item.valorEsperado)} · recebido {moeda(item.valorRecebido)}</Text>
        <Text style={[styles.diferenca, { color: cor }]}>Diferença: {moeda(item.diferenca)}</Text>
        {item.contaFinanceira ? <Text style={[styles.meta, { color: cores.textoSecundario }]}>Conta #{item.contaFinanceira.id} · {item.contaFinanceira.descricao}</Text> : null}
        {item.conciliadoEm ? <Text style={[styles.meta, { color: cores.textoSecundario }]}>Conciliado em {dataHora(item.conciliadoEm)}</Text> : null}
        {item.observacoes ? <Text style={[styles.observacao, { color: cores.texto }]}>{item.observacoes}</Text> : null}
    </View>
}

const STATUS = { PENDENTE: 'PENDENTE', CONCILIADO: 'CONCILIADO', DIVERGENTE: 'DIVERGENTE' } as const

function numero(valor: string) {
    if (!valor.trim()) return -1
    const convertido = Number(valor.replace(',', '.'))
    return Number.isFinite(convertido) ? convertido : -1
}

const styles = StyleSheet.create({
    container: { gap: 11 }, formulario: { borderWidth: 1, borderRadius: 14, padding: 15 }, titulo: { fontSize: 18, fontWeight: '900', marginBottom: 6 },
    valores: { flexDirection: 'row', gap: 10 }, flexivel: { flex: 1 }, botao: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11 }, desabilitado: { opacity: 0.5 },
    item: { borderWidth: 1, borderRadius: 13, padding: 14, gap: 5 }, linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    nome: { flex: 1, fontSize: 14, fontWeight: '900' }, meta: { fontSize: 12, lineHeight: 18 }, diferenca: { fontSize: 14, fontWeight: '900' }, observacao: { fontSize: 13, marginTop: 3 },
})
