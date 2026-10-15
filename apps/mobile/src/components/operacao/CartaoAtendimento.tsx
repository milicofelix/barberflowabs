import { useEffect, useRef, useState } from 'react'
import { DeviceEventEmitter, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { acoesAtendimento, comecaEmDezMinutos, horarioAtendimento, rotuloStatus, ROTULOS_ACOES, type AcaoAtendimento } from '@uniflowabs/core'
import type { AgendamentoOperacional } from '@/src/data/operacao/tipos'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import { EVENTO_ATENDIMENTOS } from '@/src/data/hooks/useSincronizacaoAtendimentos'

export function corStatusAtendimento(status: string) {
    return ({ AGENDADO: '#475569', CONFIRMADO: '#166534', ATRASADO: '#92400E', CHECKIN: '#1E40AF', CONCLUIDO: '#065F46', CANCELADO: '#B91C1C', NO_SHOW: '#B91C1C' } as Record<string, string>)[status] ?? '#475569'
}

export default function CartaoAtendimento({ item, agora, aoAtualizar, abrirAgenda }: {
    item: AgendamentoOperacional; agora: number; aoAtualizar?: (item: AgendamentoOperacional) => void; abrirAgenda?: () => void
}) {
    const { cores } = useTema(); const { httpPut, httpGet } = useAPI()
    const [acao, setAcao] = useState<AcaoAtendimento | null>(null)
    const [motivo, setMotivo] = useState(''); const [erro, setErro] = useState(''); const [mensagem, setMensagem] = useState('')
    const [salvando, setSalvando] = useState(false); const ocupado = useRef(false)
    const identidade = useRef(item.id)
    useEffect(() => {
        if (identidade.current !== item.id) { identidade.current = item.id; setAcao(null); setMotivo(''); setErro(''); setMensagem('') }
    }, [item.id])
    const iminente = comecaEmDezMinutos(item, agora)
    const automatico = item.estabelecimento?.fluxoAtendimentoAutomaticoAtivo && item.automacaoAtendimentoAtiva && !item.controleManualEm && item.status !== 'ATRASADO'
    async function confirmar() {
        if (!acao || ocupado.current) return
        ocupado.current = true; setSalvando(true); setErro(''); setMensagem('')
        try {
            if (!acoesAtendimento(item, Date.now()).includes(acao)) throw new Error('A ação não está mais disponível. Atualize o atendimento.')
            const retomar = acao === 'RETOMAR_AUTOMACAO'
            await httpPut(`/gestao/agendamentos/${item.id}/${retomar ? 'retomar-automacao' : 'status'}`, retomar ? {} : { status: acao, motivo: motivo.trim() || null })
            setAcao(null); setMotivo(''); setMensagem('Atendimento atualizado.')
            DeviceEventEmitter.emit(EVENTO_ATENDIMENTOS)
            try { aoAtualizar?.(await httpGet<AgendamentoOperacional>(`/gestao/agendamentos/${item.id}`)) }
            catch { setErro('Alteração salva. Não foi possível atualizar o detalhe; tente novamente ao recuperar a conexão.') }
        } catch (e) { setErro(mensagemDoErro(e)); DeviceEventEmitter.emit(EVENTO_ATENDIMENTOS) }
        finally { ocupado.current = false; setSalvando(false) }
    }
    return <View style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: iminente ? '#EA580C' : cores.borda }]}>
        <Text accessibilityRole="header" style={[styles.titulo, { color: cores.texto }]}>#{item.id} · {item.usuario?.nome ?? 'Cliente'}</Text>
        <View style={styles.linha}><Text style={[styles.badge, { backgroundColor: corStatusAtendimento(item.status) }]}>{rotuloStatus(item.status)}</Text>
            <Text style={[styles.modo, { color: cores.texto }]}>{automatico ? 'Automático' : 'Manual'}</Text></View>
        <Text style={{ color: cores.texto }}>{item.profissional?.nome ?? 'Profissional'}{item.unidade?.nome ? ` · ${item.unidade.nome}` : ''}</Text>
        <Text style={{ color: cores.textoSecundario }}>{item.servicos?.map((s) => s.nome).join(', ')}</Text>
        <Text style={{ color: cores.texto }}>{horarioAtendimento(item.data, item)}{item.dataFim ? ` → ${horarioAtendimento(item.dataFim, item)}` : ''}</Text>
        <Text style={{ color: cores.texto }}>R$ {Number(item.valorTotal).toFixed(2).replace('.', ',')}</Text>
        {iminente ? <Text style={{ color: cores.texto, fontWeight: '800' }}>Começa em até dez minutos</Text> : null}
        {!item.estabelecimento?.fluxoAtendimentoAutomaticoAtivo ? <Text style={{ color: cores.textoSecundario }}>Automação desativada nesta unidade.</Text> : null}
        {item.controleManualEm ? <Text style={{ color: cores.textoSecundario }}>Controle manual: {item.controleManualPor?.nome ?? 'Equipe'} · {horarioAtendimento(item.controleManualEm, item)}</Text> : null}
        {item.iniciadoEm ? <Text style={{ color: cores.texto }}>Início efetivo: {horarioAtendimento(item.iniciadoEm, item)}</Text> : null}
        {item.finalizadoEm ? <Text style={{ color: cores.texto }}>Finalizado em: {horarioAtendimento(item.finalizadoEm, item)}</Text> : null}
        {item.observacoes ? <Text style={{ color: cores.texto }}>Observação: {item.observacoes}</Text> : null}
        {!acao ? <View style={styles.linha}>{acoesAtendimento(item, agora).map((opcao) => <Pressable key={opcao} accessibilityRole="button" accessibilityLabel={`${ROTULOS_ACOES[opcao]}: atendimento ${item.id}`} onPress={() => { setAcao(opcao); setErro(''); setMensagem('') }} style={[styles.botao, { borderColor: cores.borda }]}>
            <Text style={{ color: cores.texto, fontWeight: '700' }}>{ROTULOS_ACOES[opcao]}</Text></Pressable>)}</View> : <View style={styles.confirmacao}>
            <Text style={{ color: cores.texto, fontWeight: '800' }}>{ROTULOS_ACOES[acao]}?</Text>
            <Text style={{ color: cores.textoSecundario }}>{acao === 'RETOMAR_AUTOMACAO' ? 'A disponibilidade será validada e o término recalculado pelo início efetivo e duração dos serviços.' : acao === 'CONFIRMADO' ? 'A reserva será confirmada, preservando a configuração atual do fluxo.' : 'Esta intervenção assume o controle manual e interrompe o fluxo automático. A finalização gera o lançamento financeiro uma única vez.'}</Text>
            {acao !== 'RETOMAR_AUTOMACAO' ? <TextInput accessibilityLabel="Motivo da alteração (opcional)" placeholder="Motivo (opcional)" placeholderTextColor={cores.textoSecundario} value={motivo} onChangeText={setMotivo} maxLength={500} editable={!salvando} style={[styles.campo, { color: cores.texto, borderColor: cores.borda }]} /> : null}
            <View style={styles.linha}>{['Voltar', 'Confirmar'].map((texto) => <Pressable key={texto} accessibilityRole="button" accessibilityState={{ disabled: salvando, busy: salvando }} disabled={salvando} onPress={texto === 'Voltar' ? () => setAcao(null) : confirmar} style={[styles.botao, { borderColor: cores.borda, opacity: salvando ? .5 : 1 }]}><Text style={{ color: cores.texto }}>{salvando && texto === 'Confirmar' ? 'Salvando…' : texto}</Text></Pressable>)}</View>
        </View>}
        {erro ? <Text accessibilityRole="alert" style={{ color: cores.perigo }}>{erro}</Text> : null}
        {mensagem ? <Text accessibilityLiveRegion="polite" style={{ color: cores.texto }}>{mensagem}</Text> : null}
        {abrirAgenda ? <Pressable accessibilityRole="button" onPress={abrirAgenda} style={[styles.botao, { borderColor: cores.borda }]}><Text style={{ color: cores.texto }}>Abrir na agenda</Text></Pressable> : null}
    </View>
}
const styles = StyleSheet.create({ cartao: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 }, titulo: { fontSize: 18, fontWeight: '900' }, linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, badge: { color: '#FFF', padding: 7, borderRadius: 8, fontWeight: '800' }, modo: { fontWeight: '800' }, botao: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, justifyContent: 'center', paddingVertical: 8 }, confirmacao: { gap: 10 }, campo: { borderWidth: 1, borderRadius: 9, padding: 12, minHeight: 44 } })
