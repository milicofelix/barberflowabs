'use client'
import Link from 'next/link'
import { acoesAtendimento, comecaEmDezMinutos, horarioAtendimento, ROTULOS_ACOES, rotuloStatus, type AcaoAtendimento, type AtendimentoOperacional } from '@/data/atendimentos/operacao'

const coresStatus: Record<string, string> = {
    CHECKIN: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
    ATRASADO: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    CONCLUIDO: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    CANCELADO: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
}
export default function CartaoAtendimentoOperacional({ item, agora, ocupado, escolher, linkAgenda = false, destacado = false }: {
    item: AtendimentoOperacional; agora: number; ocupado: boolean; destacado?: boolean; linkAgenda?: boolean
    escolher: (item: AtendimentoOperacional, acao: AcaoAtendimento) => void
}) {
    const iminente = comecaEmDezMinutos(item, agora)
    const automatico = !!item.estabelecimento?.fluxoAtendimentoAutomaticoAtivo && item.automacaoAtendimentoAtiva && !item.controleManualEm && item.status !== 'ATRASADO'
    return <article id={`atendimento-${item.id}`} tabIndex={-1} className={`rounded-2xl border bg-card p-5 text-foreground ${destacado ? 'border-blue-500 ring-2 ring-blue-500/30' : iminente ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-bold">{item.usuario?.nome ?? 'Cliente'} <span className="text-sm font-normal text-muted-foreground">· Atendimento #{item.id}</span></h3>
            <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${coresStatus[item.status] ?? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>{rotuloStatus(item.status)}</span>
                <span className="rounded-full border border-border px-3 py-1 text-sm">{automatico ? 'Automático' : 'Manual'}</span>
            </div>
        </div>
        <p className="mt-2 text-sm">{horarioAtendimento(item.data, item)}{item.dataFim ? ` → ${horarioAtendimento(item.dataFim, item)}` : ''}</p>
        <p className="mt-1 text-sm text-muted-foreground">{item.profissional?.nome ?? 'Profissional'} · {item.servicos?.map((servico) => servico.nome).join(', ')}</p>
        <p className="mt-1 text-sm font-semibold">{Number(item.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        {iminente ? <p role="status" className="mt-3 font-semibold text-amber-800 dark:text-amber-300">Começa em até 10 minutos</p> : null}
        {!item.estabelecimento?.fluxoAtendimentoAutomaticoAtivo ? <p className="mt-2 text-xs text-muted-foreground">Fluxo automático desativado na unidade.</p> : null}
        {item.controleManualEm ? <p className="mt-2 text-xs text-muted-foreground">Controle assumido por {item.controleManualPor?.nome ?? (item.controleManualPorId ? `membro #${item.controleManualPorId}` : 'equipe')} em {horarioAtendimento(item.controleManualEm, item)}.</p> : null}
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {item.iniciadoEm ? <div><dt className="font-semibold">Início efetivo</dt><dd>{horarioAtendimento(item.iniciadoEm, item)}</dd></div> : null}
            {item.finalizadoEm ? <div><dt className="font-semibold">Finalizado em</dt><dd>{horarioAtendimento(item.finalizadoEm, item)}</dd></div> : null}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
            {acoesAtendimento(item, agora).map((acao) => <button key={acao} type="button" disabled={ocupado} onClick={() => escolher(item, acao)} className="min-h-11 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-blue-500/10 disabled:opacity-50">{ROTULOS_ACOES[acao]}</button>)}
            {linkAgenda ? <Link className="min-h-11 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 underline dark:text-blue-300" href={`/gestao?aba=agenda&agendamentoId=${item.id}`}>Abrir na agenda</Link> : null}
        </div>
    </article>
}
