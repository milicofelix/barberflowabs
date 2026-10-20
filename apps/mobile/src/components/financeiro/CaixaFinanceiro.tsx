import CampoTexto from '@/src/components/shared/CampoTexto'
import Confirmacao from '@/src/components/shared/Confirmacao'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useTema from '@/src/data/contexts/ContextoTema'
import { dataHora, moeda } from '@/src/data/financeiro/formatacao'
import type { FechamentoCaixa } from '@/src/data/financeiro/tipos'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Props {
    caixas: FechamentoCaixa[]; podeGerenciar: boolean; executando: boolean
    abrir: (dados: { saldoInicial?: number; observacoes?: string }) => Promise<boolean>
    fechar: (id: number, dados: { saldoInformado: number; observacoes?: string }) => Promise<boolean>
}

export default function CaixaFinanceiro({ caixas, podeGerenciar, executando, abrir, fechar }: Props) {
    const { cores } = useTema()
    const caixaAberto = caixas.find((caixa) => caixa.status === 'ABERTO')
    const [saldo, setSaldo] = useState('0')
    const [observacoes, setObservacoes] = useState('')
    const [confirmarFechamento, setConfirmarFechamento] = useState(false)
    const valor = Number(saldo.replace(',', '.'))
    const valorInvalido = !Number.isFinite(valor) || valor < 0

    async function submeter() {
        if (valorInvalido || executando) return
        if (caixaAberto) { setConfirmarFechamento(true); return }
        if (await abrir({ saldoInicial: valor, observacoes: observacoes.trim() || undefined })) limpar()
    }

    async function concluirFechamento() {
        if (!caixaAberto || valorInvalido || executando) return
        if (await fechar(caixaAberto.id, { saldoInformado: valor, observacoes: observacoes.trim() || undefined })) { setConfirmarFechamento(false); limpar() }
    }

    function limpar() { setSaldo('0'); setObservacoes('') }

    return <View style={styles.container}>
        {caixaAberto ? <View style={[styles.aberto, { backgroundColor: cores.superficie, borderColor: cores.sucesso }]}>
            <Text style={[styles.estado, { color: cores.sucesso }]}>CAIXA ABERTO</Text><Text style={[styles.nome, { color: cores.texto }]}>Aberto por {caixaAberto.abertoPor.nome}</Text>
            <Text style={[styles.meta, { color: cores.textoSecundario }]}>{dataHora(caixaAberto.abertoEm)} · saldo inicial {moeda(caixaAberto.saldoInicial)}</Text>
        </View> : <View style={[styles.aberto, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.nome, { color: cores.texto }]}>Nenhum caixa aberto</Text></View>}

        {podeGerenciar ? <View style={[styles.formulario, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <Text style={[styles.titulo, { color: cores.texto }]}>{caixaAberto ? 'Fechar caixa' : 'Abrir caixa'}</Text>
            <CampoTexto label={caixaAberto ? 'Saldo contado' : 'Saldo inicial'} value={saldo} onChangeText={setSaldo} keyboardType="decimal-pad"
                error={valorInvalido ? 'Informe um saldo igual ou maior que zero.' : undefined} />
            <CampoTexto label="Observações (opcional)" value={observacoes} onChangeText={setObservacoes} multiline />
            <Pressable disabled={executando || valorInvalido} onPress={submeter} style={[styles.botao, { backgroundColor: cores.destaque }, (executando || valorInvalido) && styles.desabilitado]}>
                <Text style={[styles.botaoTexto, { color: cores.destaqueTexto }]}>{executando ? 'Processando...' : caixaAberto ? 'Conferir e fechar' : 'Abrir caixa'}</Text>
            </Pressable>
        </View> : null}

        <Text style={[styles.titulo, { color: cores.texto }]}>Histórico de caixa</Text>
        {!caixas.length ? <EstadoVazio titulo="Nenhum caixa registrado" /> : caixas.map((caixa) => <View key={caixa.id} style={[styles.item, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.linha}><Text style={[styles.nome, { color: cores.texto }]}>Caixa #{caixa.id}</Text><Text style={{ color: caixa.status === 'ABERTO' ? cores.sucesso : cores.textoSecundario, fontWeight: '900' }}>{caixa.status}</Text></View>
            <Text style={[styles.meta, { color: cores.textoSecundario }]}>Abertura: {dataHora(caixa.abertoEm)}{caixa.fechadoEm ? ` · fechamento: ${dataHora(caixa.fechadoEm)}` : ''}</Text>
            {caixa.status === 'FECHADO' ? <><Text style={[styles.meta, { color: cores.texto }]}>Esperado {moeda(caixa.saldoEsperado)} · informado {moeda(caixa.saldoInformado)}</Text>
                <Text style={{ color: Number(caixa.diferenca ?? 0) === 0 ? cores.sucesso : cores.perigo, fontWeight: '800' }}>Diferença: {moeda(caixa.diferenca)}</Text></> : null}
        </View>)}
        <Confirmacao visivel={confirmarFechamento} titulo="Fechar caixa" mensagem={`Saldo contado: ${moeda(valor)}. Confirme o fechamento; a diferença será calculada automaticamente.`}
            confirmarLabel={executando ? 'Fechando...' : 'Fechar caixa'} onConfirmar={concluirFechamento} onCancelar={() => setConfirmarFechamento(false)} />
    </View>
}

const styles = StyleSheet.create({
    container: { gap: 11 }, aberto: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 5 }, estado: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    formulario: { borderWidth: 1, borderRadius: 14, padding: 15 }, titulo: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
    nome: { fontSize: 15, fontWeight: '900' }, meta: { fontSize: 12, lineHeight: 18 }, botao: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
    botaoTexto: { fontWeight: '900' }, desabilitado: { opacity: 0.5 }, item: { borderWidth: 1, borderRadius: 13, padding: 14, gap: 5 },
    linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
})
