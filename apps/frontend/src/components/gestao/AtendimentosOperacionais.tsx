'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAtendimentosOperacionais from '@/data/hooks/useAtendimentosOperacionais'
import { dataAtendimento } from '@/data/atendimentos/operacao'
import CartaoAtendimentoOperacional from './CartaoAtendimentoOperacional'
import DialogoAcaoAtendimento, { type AcaoPendenteAtendimento } from './DialogoAcaoAtendimento'

const hojeLocal = () => { const hoje = new Date(); return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}` }
export default function AtendimentosOperacionais({ modo, selecionadoId }: { modo: 'home' | 'agenda'; selecionadoId?: number | null }) {
    const router = useRouter()
    const [data, setData] = useState(hojeLocal)
    const [pendente, setPendente] = useState<AcaoPendenteAtendimento | null>(null)
    const dados = useAtendimentosOperacionais(modo, data, selecionadoId)
    const selecionadoAberto = useRef<number | null>(null)
    useEffect(() => {
        if (!dados.selecionado || selecionadoAberto.current === dados.selecionado.id) return
        selecionadoAberto.current = dados.selecionado.id
        setData(dataAtendimento(dados.selecionado))
        document.getElementById(`atendimento-${dados.selecionado.id}`)?.focus()
        document.getElementById(`atendimento-${dados.selecionado.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, [dados.selecionado])
    return <section className="flex flex-col gap-4" aria-label={modo === 'home' ? 'Atendimentos da unidade' : 'Agenda operacional'}>
        <div className="flex flex-wrap items-center justify-between gap-3"><div>
            <h2 className="text-2xl font-bold text-foreground">{modo === 'home' ? 'Próximos atendimentos' : 'Agenda de atendimentos'}</h2>
            {modo === 'home' ? <p className="mt-1 text-sm text-muted-foreground">Atendimentos em andamento, próximas reservas e finalizados nas últimas 24 horas.</p> : null}
        </div><button type="button" onClick={() => { void dados.carregar() }} className="min-h-11 rounded-lg border border-border px-4 py-2 text-foreground">Atualizar</button></div>
        {modo === 'agenda' ? <label className="flex max-w-xs flex-col gap-2 text-sm text-foreground">Data da agenda<input type="date" value={data} onChange={(evento) => setData(evento.target.value)} className="rounded-lg border border-border bg-card p-3" /></label> : null}
        {dados.carregando ? <p role="status" className="text-muted-foreground">Carregando atendimentos...</p> : null}
        {dados.erro ? <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-red-800 dark:text-red-300">{dados.erro}</p> : null}
        {dados.mensagem ? <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300">{dados.mensagem}</p> : null}
        {dados.selecionado ? <div className="flex flex-col gap-2"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-foreground">Atendimento selecionado</h3><button type="button" className="min-h-11 px-3 text-sm text-foreground" onClick={() => { selecionadoAberto.current = null; router.replace('/gestao?aba=agenda', { scroll: false }) }}>Fechar seleção</button></div>
            <CartaoAtendimentoOperacional item={dados.selecionado} agora={dados.agora} ocupado={dados.processando !== null} destacado escolher={(item, acao) => { dados.limparErroAcao(); setPendente({ item, acao }) }} />
        </div> : null}
        <div className="grid gap-3">{dados.itens.filter((item) => item.id !== dados.selecionado?.id).map((item) => <CartaoAtendimentoOperacional key={item.id} item={item} agora={dados.agora} ocupado={dados.processando !== null} linkAgenda={modo === 'home'} escolher={(item, acao) => { dados.limparErroAcao(); setPendente({ item, acao }) }} />)}</div>
        {!dados.carregando && !dados.erro && !dados.itens.length && !dados.selecionado ? <p className="rounded-xl border border-border p-5 text-muted-foreground">Nenhum atendimento neste período.</p> : null}
        <DialogoAcaoAtendimento pendente={pendente} ocupado={dados.processando !== null} erro={dados.erro} fechar={() => setPendente(null)} confirmar={(acao, motivo) => dados.executar(acao.item, acao.acao, motivo)} />
    </section>
}
