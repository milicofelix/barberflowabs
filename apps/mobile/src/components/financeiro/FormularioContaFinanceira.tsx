import CampoTexto from '@/src/components/shared/CampoTexto'
import useTema from '@/src/data/contexts/ContextoTema'
import { periodoHoje } from '@/src/data/financeiro/formatacao'
import type { CriarContaFinanceira, TipoConta } from '@/src/data/financeiro/tipos'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Props {
    executando: boolean
    salvar: (conta: CriarContaFinanceira) => Promise<boolean>
}

const FORMULARIO_INICIAL = { tipo: 'RECEBER' as TipoConta, descricao: '', categoria: '', valor: '', competencia: periodoHoje().inicio, vencimento: periodoHoje().fim }

export default function FormularioContaFinanceira({ executando, salvar }: Props) {
    const { cores } = useTema()
    const [form, setForm] = useState(FORMULARIO_INICIAL)
    const [tentouEnviar, setTentouEnviar] = useState(false)
    const valor = Number(form.valor.replace(',', '.'))

    async function submeter() {
        setTentouEnviar(true)
        if (!form.descricao.trim() || !Number.isFinite(valor) || valor <= 0 || executando) return
        const sucesso = await salvar({
            tipo: form.tipo, descricao: form.descricao.trim(), categoria: form.categoria.trim() || undefined,
            valorOriginal: valor, competencia: form.competencia, vencimento: form.vencimento,
        })
        if (sucesso) { setForm({ ...FORMULARIO_INICIAL, tipo: form.tipo }); setTentouEnviar(false) }
    }

    return <View style={[styles.container, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <Text style={[styles.titulo, { color: cores.texto }]}>Nova conta</Text>
        <View style={styles.tipos}>{(['RECEBER', 'PAGAR'] as const).map((tipo) => <Pressable key={tipo}
            onPress={() => setForm({ ...form, tipo })} style={[styles.tipo, { borderColor: cores.borda }, form.tipo === tipo && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}>
            <Text style={{ color: form.tipo === tipo ? cores.destaqueTexto : cores.texto, fontWeight: '800' }}>{tipo === 'RECEBER' ? 'A receber' : 'A pagar'}</Text>
        </Pressable>)}</View>
        <CampoTexto label="Descrição" value={form.descricao} onChangeText={(descricao) => setForm({ ...form, descricao })}
            error={tentouEnviar && !form.descricao.trim() ? 'Informe uma descrição.' : undefined} />
        <CampoTexto label="Categoria (opcional)" value={form.categoria} onChangeText={(categoria) => setForm({ ...form, categoria })} />
        <CampoTexto label="Valor" value={form.valor} onChangeText={(valorDigitado) => setForm({ ...form, valor: valorDigitado })} keyboardType="decimal-pad"
            error={tentouEnviar && (!Number.isFinite(valor) || valor <= 0) ? 'Informe um valor maior que zero.' : undefined} />
        <View style={styles.datas}><View style={styles.data}><CampoTexto label="Competência" value={form.competencia} onChangeText={(competencia) => setForm({ ...form, competencia })} /></View>
            <View style={styles.data}><CampoTexto label="Vencimento" value={form.vencimento} onChangeText={(vencimento) => setForm({ ...form, vencimento })} /></View></View>
        <Pressable disabled={executando} onPress={submeter} style={[styles.botao, { backgroundColor: cores.destaque }, executando && styles.desabilitado]}>
            <Text style={[styles.botaoTexto, { color: cores.destaqueTexto }]}>{executando ? 'Salvando...' : 'Criar conta'}</Text>
        </Pressable>
    </View>
}

const styles = StyleSheet.create({
    container: { borderWidth: 1, borderRadius: 14, padding: 15 }, titulo: { fontSize: 18, fontWeight: '900', marginBottom: 13 },
    tipos: { flexDirection: 'row', gap: 8, marginBottom: 14 }, tipo: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, padding: 10 },
    datas: { flexDirection: 'row', gap: 10 }, data: { flex: 1 }, botao: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
    botaoTexto: { fontWeight: '900' }, desabilitado: { opacity: 0.55 },
})
