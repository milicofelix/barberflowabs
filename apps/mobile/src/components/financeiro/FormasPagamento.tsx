import CampoTexto from '@/src/components/shared/CampoTexto'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useTema from '@/src/data/contexts/ContextoTema'
import { moeda } from '@/src/data/financeiro/formatacao'
import type { FormaPagamento, SalvarFormaPagamento, TipoFormaPagamento } from '@/src/data/financeiro/tipos'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Props {
    formas: FormaPagamento[]; podeGerenciar: boolean; executando: boolean
    salvar: (dados: SalvarFormaPagamento, id?: number) => Promise<boolean>
}

const TIPOS: TipoFormaPagamento[] = ['DINHEIRO', 'PIX', 'CREDITO', 'DEBITO', 'TRANSFERENCIA', 'OUTRO']
const INICIAL = { nome: '', tipo: 'PIX' as TipoFormaPagamento, taxaPercentual: '0', taxaFixa: '0', prazoRecebimento: '0' }

export default function FormasPagamento({ formas, podeGerenciar, executando, salvar }: Props) {
    const { cores } = useTema()
    const [form, setForm] = useState(INICIAL)

    async function criar() {
        const taxaPercentual = numero(form.taxaPercentual); const taxaFixa = numero(form.taxaFixa); const prazoRecebimento = Number(form.prazoRecebimento)
        if (!form.nome.trim() || !Number.isFinite(taxaPercentual) || taxaPercentual < 0 || taxaPercentual > 100
            || !Number.isFinite(taxaFixa) || taxaFixa < 0 || !Number.isInteger(prazoRecebimento) || prazoRecebimento < 0 || executando) return
        if (await salvar({ nome: form.nome.trim(), tipo: form.tipo, taxaPercentual, taxaFixa, prazoRecebimento })) setForm(INICIAL)
    }

    function alternar(forma: FormaPagamento) {
        return salvar({ nome: forma.nome, tipo: forma.tipo, taxaPercentual: Number(forma.taxaPercentual), taxaFixa: Number(forma.taxaFixa), prazoRecebimento: forma.prazoRecebimento, ativa: !forma.ativa }, forma.id)
    }

    return <View style={styles.container}>
        {podeGerenciar ? <View style={[styles.formulario, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <Text style={[styles.titulo, { color: cores.texto }]}>Nova forma de pagamento</Text>
            <CampoTexto label="Nome" value={form.nome} onChangeText={(nome) => setForm({ ...form, nome })} />
            <Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Tipo</Text><View style={styles.chips}>{TIPOS.map((tipo) => <Pressable key={tipo} onPress={() => setForm({ ...form, tipo })}
                style={[styles.chip, { borderColor: cores.borda }, form.tipo === tipo && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}><Text style={{ color: form.tipo === tipo ? cores.destaqueTexto : cores.texto, fontSize: 11, fontWeight: '800' }}>{rotulo(tipo)}</Text></Pressable>)}</View>
            <View style={styles.campos}><View style={styles.campo}><CampoTexto label="Taxa %" value={form.taxaPercentual} onChangeText={(taxaPercentual) => setForm({ ...form, taxaPercentual })} keyboardType="decimal-pad" /></View>
                <View style={styles.campo}><CampoTexto label="Taxa fixa" value={form.taxaFixa} onChangeText={(taxaFixa) => setForm({ ...form, taxaFixa })} keyboardType="decimal-pad" /></View></View>
            <CampoTexto label="Prazo para recebimento (dias)" value={form.prazoRecebimento} onChangeText={(prazoRecebimento) => setForm({ ...form, prazoRecebimento })} keyboardType="number-pad" />
            <Pressable disabled={executando || !form.nome.trim()} onPress={criar} style={[styles.botao, { backgroundColor: cores.destaque }, (executando || !form.nome.trim()) && styles.desabilitado]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{executando ? 'Salvando...' : 'Adicionar forma'}</Text></Pressable>
        </View> : null}
        <Text style={[styles.titulo, { color: cores.texto }]}>Formas aceitas</Text>
        {!formas.length ? <EstadoVazio titulo="Nenhuma forma de pagamento" /> : formas.map((forma) => <View key={forma.id} style={[styles.item, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.linha}><Text style={[styles.nome, { color: cores.texto }]}>{forma.nome}</Text><Text style={{ color: forma.ativa ? cores.sucesso : cores.textoSecundario, fontWeight: '900' }}>{forma.ativa ? 'ATIVA' : 'INATIVA'}</Text></View>
            <Text style={[styles.meta, { color: cores.textoSecundario }]}>{rotulo(forma.tipo)} · {Number(forma.taxaPercentual)}% + {moeda(forma.taxaFixa)} · D+{forma.prazoRecebimento}</Text>
            {podeGerenciar ? <Pressable disabled={executando} onPress={() => alternar(forma)} style={[styles.acao, { borderColor: forma.ativa ? cores.perigo : cores.sucesso }]}><Text style={{ color: forma.ativa ? cores.perigo : cores.sucesso, fontWeight: '800' }}>{forma.ativa ? 'Desativar' : 'Ativar'}</Text></Pressable> : null}
        </View>)}
    </View>
}

const numero = (valor: string) => Number(valor.replace(',', '.'))
const ROTULOS: Record<TipoFormaPagamento, string> = { DINHEIRO: 'Dinheiro', PIX: 'Pix', CREDITO: 'Crédito', DEBITO: 'Débito', TRANSFERENCIA: 'Transferência', OUTRO: 'Outro' }
const rotulo = (tipo: TipoFormaPagamento) => ROTULOS[tipo]

const styles = StyleSheet.create({
    container: { gap: 11 }, formulario: { borderWidth: 1, borderRadius: 14, padding: 15 }, titulo: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
    rotulo: { fontSize: 12, fontWeight: '800', marginBottom: 7 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
    chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 }, campos: { flexDirection: 'row', gap: 10 }, campo: { flex: 1 },
    botao: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11 }, desabilitado: { opacity: 0.5 },
    item: { borderWidth: 1, borderRadius: 13, padding: 14, gap: 6 }, linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    nome: { flex: 1, fontSize: 15, fontWeight: '900' }, meta: { fontSize: 12, lineHeight: 18 }, acao: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9, marginTop: 3 },
})
