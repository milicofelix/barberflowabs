'use client'
import { useCallback, useEffect, useState } from 'react'
import { METRICAS_FLUXO_ATENDIMENTO, OPCOES_FLUXO_ATENDIMENTO, type ConfiguracaoFluxoAtendimento, type MonitoramentoAtendimento } from '@uniflowabs/core'
import useAPI from '@/data/hooks/useAPI'
import { EVENTO_ATENDIMENTOS_ATUALIZADOS } from '@/data/atendimentos/operacao'

export default function PainelFluxoAtendimento() {
    const { httpGet, httpPut, httpPost } = useAPI()
    const [config, setConfig] = useState<ConfiguracaoFluxoAtendimento | null>(null)
    const [monitor, setMonitor] = useState<MonitoramentoAtendimento | null>(null)
    const [confirmado, setConfirmado] = useState(false); const [ativaInicial, setAtivaInicial] = useState(false)
    const [ocupado, setOcupado] = useState(false); const [erro, setErro] = useState(''); const [mensagem, setMensagem] = useState('')
    const [tarefa, setTarefa] = useState<number | null>(null)
    const carregar = useCallback(async () => {
        try {
            const [dados, painel] = await Promise.all([httpGet('/atendimentos/operacao/configuracao'), httpGet('/atendimentos/operacao/monitoramento')])
            if (dados?.statusCode || painel?.statusCode || !dados || !painel) throw new Error(dados?.message ?? painel?.message ?? 'Não foi possível carregar o fluxo.')
            setConfig(dados); setAtivaInicial(dados.fluxoAtendimentoAutomaticoAtivo); setMonitor(painel); setConfirmado(false); setErro('')
        } catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao carregar o fluxo.') }
    }, [httpGet])
    useEffect(() => { void carregar() }, [carregar])
    async function executar(reprocessar?: number) {
        if (ocupado || !config) return
        if (!reprocessar && config.fluxoAtendimentoAutomaticoAtivo && !ativaInicial && !confirmado) { setErro('Confirme a homologação antes de ativar a unidade.'); return }
        setOcupado(true); setErro(''); setMensagem('')
        try {
            const resposta = reprocessar ? await httpPost(`/atendimentos/operacao/tarefas/${reprocessar}/reprocessar`, {}) : await httpPut('/atendimentos/operacao/configuracao', config)
            if (!resposta || resposta.statusCode) throw new Error(resposta?.message ?? 'Não foi possível salvar.')
            setTarefa(null); await carregar(); setMensagem(reprocessar ? 'Tarefa reenfileirada para o worker. O status do atendimento não foi alterado por este botão.' : 'Configuração do fluxo salva.')
            window.dispatchEvent(new Event(EVENTO_ATENDIMENTOS_ATUALIZADOS))
        } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível concluir a operação.') }
        finally { setOcupado(false) }
    }
    return <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-foreground">
        <h2 className="text-xl font-bold">Fluxo automático de atendimentos</h2>
        <p className="text-sm text-muted-foreground">Ative uma unidade piloto somente depois da homologação. Ao ativar, reservas automáticas elegíveis existentes também podem ser processadas, inclusive horários já vencidos. Intervenções manuais nunca são retomadas por esta configuração.</p>
        {config ? <fieldset disabled={ocupado} className="grid gap-3">
            {OPCOES_FLUXO_ATENDIMENTO.map(({ campo, titulo }) => <label key={campo} className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={config[campo]} onChange={(e) => setConfig({ ...config, [campo]: e.target.checked })} />{titulo}</label>)}
            <label className="grid gap-2">Avisar profissional antes (1 a 60 minutos)<input className="input max-w-xs" type="number" min={1} max={60} step={1} value={config.avisoAtendimentoAntecedenciaMinutos} onChange={(e) => setConfig({ ...config, avisoAtendimentoAntecedenciaMinutos: Number(e.target.value) })} /></label>
            {config.fluxoAtendimentoAutomaticoAtivo && !ativaInicial ? <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} />Homologuei esta unidade e autorizo sua ativação.</label> : null}
            <button type="button" onClick={() => executar()} className="min-h-11 rounded-lg border border-border px-4 py-2 font-bold">{ocupado ? 'Salvando…' : 'Salvar fluxo de atendimento'}</button>
        </fieldset> : <p>Configuração ainda não carregada.</p>}
        <button type="button" disabled={ocupado} onClick={carregar} className="min-h-11 rounded-lg border border-border px-4 py-2">Atualizar painel e configuração</button>
        {erro ? <p role="alert" className="text-red-600 dark:text-red-300">{erro}</p> : null}{mensagem ? <p role="status">{mensagem}</p> : null}
        {monitor ? <>
            <p className="text-sm text-muted-foreground">Worker {monitor.workerHabilitado ? 'habilitado na configuração do servidor (não comprova atividade)' : 'desabilitado no servidor'}. Atualizado em {new Date(monitor.geradoEm).toLocaleString('pt-BR')}.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{METRICAS_FLUXO_ATENDIMENTO.map(({ campo, titulo }) => <div key={campo} className="rounded-lg border border-border p-3"><p className="text-sm">{titulo}</p><strong className="text-xl">{monitor.metricas[campo]}</strong></div>)}</div>
            <p className="text-sm text-muted-foreground">Até 50 tarefas com falha, vencidas ou lock expirado, ordenadas pela data. Tarefas vencidas aguardam o worker; somente falhas podem ser reenfileiradas. Divergências financeiras exigem revisão no Financeiro; este painel não lança receita nem altera comissões.</p>
            {!monitor.tarefas.length ? <p>Nenhuma pendência na fila.</p> : monitor.tarefas.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <p>Tarefa #{item.id} · Atendimento #{item.agendamentoId} · {item.tipo} · {item.status}<br /><span className="text-sm text-muted-foreground">{new Date(item.dataPrevista).toLocaleString('pt-BR')} · {item.tentativas} tentativas</span></p>
                {item.status === 'FALHOU' ? tarefa === item.id ? <div className="flex flex-wrap gap-2"><span>Reenfileirar a mesma tarefa?</span><button type="button" disabled={ocupado} onClick={() => executar(item.id)} className="min-h-11 rounded border border-border px-3">Confirmar</button><button type="button" disabled={ocupado} onClick={() => setTarefa(null)} className="min-h-11 rounded border border-border px-3">Voltar</button></div> : <button type="button" disabled={ocupado} onClick={() => setTarefa(item.id)} className="min-h-11 rounded border border-border px-3">Reprocessar</button> : null}
            </div>)}
        </> : null}
    </section>
}
