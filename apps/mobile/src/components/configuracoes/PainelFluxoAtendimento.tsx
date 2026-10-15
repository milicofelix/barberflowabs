import { useCallback, useEffect, useRef, useState } from 'react'
import { DeviceEventEmitter, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { METRICAS_FLUXO_ATENDIMENTO, OPCOES_FLUXO_ATENDIMENTO, type ConfiguracaoFluxoAtendimento, type MonitoramentoAtendimento } from '@uniflowabs/core'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import { EVENTO_ATENDIMENTOS } from '@/src/data/hooks/useSincronizacaoAtendimentos'

export default function PainelFluxoAtendimento() {
    const { cores } = useTema(); const { httpGet, httpPut, httpPost } = useAPI()
    const [config, setConfig] = useState<ConfiguracaoFluxoAtendimento | null>(null)
    const [monitor, setMonitor] = useState<MonitoramentoAtendimento | null>(null)
    const [confirmado, setConfirmado] = useState(false); const [ativaInicial, setAtivaInicial] = useState(false)
    const [ocupado, setOcupado] = useState(false); const trava = useRef(false)
    const [erro, setErro] = useState(''); const [mensagem, setMensagem] = useState(''); const [tarefa, setTarefa] = useState<number | null>(null)
    const carregar = useCallback(async () => {
        try {
            const [dados, painel] = await Promise.all([httpGet<ConfiguracaoFluxoAtendimento>('/atendimentos/operacao/configuracao'), httpGet<MonitoramentoAtendimento>('/atendimentos/operacao/monitoramento')])
            setConfig(dados); setAtivaInicial(dados.fluxoAtendimentoAutomaticoAtivo); setConfirmado(false); setMonitor(painel); setErro('')
        } catch (e) { setErro(mensagemDoErro(e)) }
    }, [httpGet])
    useEffect(() => { void carregar() }, [carregar])
    async function executar(reprocessar?: number) {
        if (!config || trava.current) return
        if (!reprocessar && config.fluxoAtendimentoAutomaticoAtivo && !ativaInicial && !confirmado) { setErro('Confirme a homologação antes de ativar a unidade.'); return }
        trava.current = true; setOcupado(true); setErro(''); setMensagem('')
        try {
            if (reprocessar) await httpPost(`/atendimentos/operacao/tarefas/${reprocessar}/reprocessar`, {})
            else await httpPut('/atendimentos/operacao/configuracao', config)
            setTarefa(null); await carregar(); setMensagem(reprocessar ? 'Tarefa reenfileirada para o worker; atendimento não alterado por este botão.' : 'Configuração do fluxo salva.')
            DeviceEventEmitter.emit(EVENTO_ATENDIMENTOS)
        } catch (e) { setErro(mensagemDoErro(e)) }
        finally { trava.current = false; setOcupado(false) }
    }
    function botao(texto: string, acao: () => void) {
        return <Pressable accessibilityRole="button" accessibilityState={{ disabled: ocupado }} disabled={ocupado} onPress={acao} style={[styles.botao, { borderColor: cores.borda, opacity: ocupado ? .5 : 1 }]}><Text style={{ color: cores.texto, fontWeight: '800' }}>{texto}</Text></Pressable>
    }
    return <View style={[styles.painel, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <Text accessibilityRole="header" style={[styles.titulo, { color: cores.texto }]}>Fluxo automático de atendimentos</Text>
        <Text style={{ color: cores.textoSecundario }}>Ative uma unidade piloto somente após homologar. Reservas automáticas elegíveis existentes também podem ser processadas, inclusive horários vencidos. O controle manual nunca é retomado por esta configuração.</Text>
        {config ? <>
            {OPCOES_FLUXO_ATENDIMENTO.map(({ campo, titulo }) => <View key={campo} style={styles.linha}><Text style={[styles.rotulo, { color: cores.texto }]}>{titulo}</Text><Switch accessibilityLabel={titulo} disabled={ocupado} value={config[campo]} onValueChange={(valor) => setConfig({ ...config, [campo]: valor })} /></View>)}
            <Text style={{ color: cores.texto }}>Antecedência do aviso (1 a 60 minutos)</Text>
            <TextInput accessibilityLabel="Antecedência do aviso em minutos" editable={!ocupado} keyboardType="number-pad" value={String(config.avisoAtendimentoAntecedenciaMinutos)} onChangeText={(valor) => setConfig({ ...config, avisoAtendimentoAntecedenciaMinutos: Number(valor.replace(/\D/g, '')) })} style={[styles.botao, { color: cores.texto, borderColor: cores.borda }]} />
            {config.fluxoAtendimentoAutomaticoAtivo && !ativaInicial ? <View style={styles.linha}><Text style={[styles.rotulo, { color: cores.texto }]}>Homologuei esta unidade e autorizo sua ativação.</Text><Switch accessibilityLabel="Confirmar homologação da unidade" disabled={ocupado} value={confirmado} onValueChange={setConfirmado} /></View> : null}
            {botao(ocupado ? 'Salvando…' : 'Salvar fluxo de atendimento', () => { void executar() })}
        </> : null}
        {botao('Atualizar painel e configuração', () => { void carregar() })}
        {erro ? <Text accessibilityRole="alert" style={{ color: cores.perigo }}>{erro}</Text> : null}
        {mensagem ? <Text accessibilityLiveRegion="polite" style={{ color: cores.texto }}>{mensagem}</Text> : null}
        {monitor ? <>
            <Text style={{ color: cores.textoSecundario }}>Worker {monitor.workerHabilitado ? 'habilitado na configuração (não comprova atividade)' : 'desabilitado no servidor'}. Atualizado em {new Date(monitor.geradoEm).toLocaleString('pt-BR')}.</Text>
            {METRICAS_FLUXO_ATENDIMENTO.map(({ campo, titulo }) => <Text key={campo} style={{ color: cores.texto }}>{titulo}: {monitor.metricas[campo]}</Text>)}
            <Text style={{ color: cores.textoSecundario }}>Até 50 pendências, ordenadas pela data. Vencidas aguardam o worker; só falhas podem ser reenfileiradas. Divergências financeiras devem ser revisadas no Financeiro; este painel não lança receita nem altera comissões.</Text>
            {!monitor.tarefas.length ? <Text style={{ color: cores.texto }}>Nenhuma pendência na fila.</Text> : monitor.tarefas.map((item) => <View key={item.id} style={[styles.tarefa, { borderColor: cores.borda }]}>
                <Text style={{ color: cores.texto }}>Tarefa #{item.id} · Atendimento #{item.agendamentoId} · {item.tipo} · {item.status}</Text>
                <Text style={{ color: cores.textoSecundario }}>{new Date(item.dataPrevista).toLocaleString('pt-BR')} · {item.tentativas} tentativas</Text>
                {item.status === 'FALHOU' ? tarefa === item.id ? <><Text style={{ color: cores.texto }}>Reenfileirar a mesma tarefa?</Text>{botao('Confirmar reprocessamento', () => { void executar(item.id) })}{botao('Voltar', () => setTarefa(null))}</> : botao('Reprocessar', () => setTarefa(item.id)) : null}
            </View>)}
        </> : null}
    </View>
}
const styles = StyleSheet.create({ painel: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 12 }, titulo: { fontSize: 19, fontWeight: '900' }, linha: { flexDirection: 'row', alignItems: 'center', gap: 12 }, rotulo: { flex: 1 }, botao: { minHeight: 44, borderWidth: 1, borderRadius: 10, padding: 12, justifyContent: 'center' }, tarefa: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 } })
