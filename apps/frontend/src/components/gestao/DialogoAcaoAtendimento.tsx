'use client'
import { useEffect, useRef, useState } from 'react'
import { ROTULOS_ACOES, type AcaoAtendimento, type AtendimentoOperacional } from '@/data/atendimentos/operacao'

export interface AcaoPendenteAtendimento { item: AtendimentoOperacional; acao: AcaoAtendimento }
export default function DialogoAcaoAtendimento({ pendente, ocupado, erro, fechar, confirmar }: {
    pendente: AcaoPendenteAtendimento | null; ocupado: boolean; fechar: () => void
    erro?: string
    confirmar: (pendente: AcaoPendenteAtendimento, motivo: string) => Promise<boolean>
}) {
    const dialogo = useRef<HTMLDialogElement>(null); const [motivo, setMotivo] = useState('')
    useEffect(() => {
        setMotivo('')
        if (pendente) dialogo.current?.showModal()
        else dialogo.current?.close()
    }, [pendente])
    return <dialog ref={dialogo} aria-labelledby="titulo-acao-atendimento" onCancel={(evento) => { evento.preventDefault(); if (!ocupado) fechar() }} className="w-[min(92vw,480px)] rounded-2xl border border-border bg-background p-6 text-foreground backdrop:bg-black/60">
        {pendente ? <form className="flex flex-col gap-4" onSubmit={async (evento) => { evento.preventDefault(); if (!ocupado && await confirmar(pendente, motivo)) fechar() }}>
            <h2 id="titulo-acao-atendimento" className="text-xl font-bold">{ROTULOS_ACOES[pendente.acao]} · #{pendente.item.id}</h2>
            <p>{pendente.item.usuario?.nome ?? 'Cliente'} · {pendente.item.profissional?.nome ?? 'Profissional'}</p>
            <p className="text-sm text-muted-foreground">{pendente.acao === 'RETOMAR_AUTOMACAO'
                ? 'A unidade retomará o fluxo automático. Após um atraso, o término previsto será recalculado pelo início efetivo e pela duração dos serviços.'
                : pendente.acao === 'CONFIRMADO' ? 'Confirme a reserva deste atendimento.' : 'Esta ação assume o controle manual deste atendimento e interrompe as transições automáticas.'}</p>
            {pendente.acao === 'CONCLUIDO' ? <p className="text-sm text-muted-foreground">A finalização registra a receita uma única vez e encerra o atendimento.</p> : null}
            {erro ? <p role="alert" className="text-sm text-red-700 dark:text-red-300">{erro}</p> : null}
            {pendente.acao !== 'RETOMAR_AUTOMACAO' ? <label className="flex flex-col gap-2 text-sm">Motivo (opcional)<textarea className="rounded-lg border border-border bg-card p-3" value={motivo} maxLength={500} disabled={ocupado} onChange={(evento) => setMotivo(evento.target.value)} /></label> : null}
            <div className="flex flex-wrap gap-3"><button type="submit" disabled={ocupado} className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{ocupado ? 'Salvando...' : 'Confirmar ação'}</button>
                <button type="button" disabled={ocupado} onClick={fechar} className="min-h-11 rounded-lg border border-border px-4 py-2">Voltar</button></div>
        </form> : null}
    </dialog>
}
