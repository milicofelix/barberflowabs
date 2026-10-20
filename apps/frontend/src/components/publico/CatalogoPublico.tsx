'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import useAPI from '@/data/hooks/useAPI'
import useCatalogoPublico, { type TipoCatalogo } from '@/data/hooks/useCatalogoPublico'
import ItemServico from '@/components/servico/ItemServico'
import ItemProfissional from '@/components/profissional/ItemProfissional'

export default function CatalogoPublico({ tipo, completo = false, segmentoInicial = '' }: { tipo: TipoCatalogo; completo?: boolean; segmentoInicial?: string }) {
    const { httpGet } = useAPI()
    const [segmentos, setSegmentos] = useState<Array<{ slug: string; nome: string }>>([])
    const [erroSegmentos, setErroSegmentos] = useState(false)
    const [segmento, setSegmento] = useState(segmentoInicial); const [q, setQ] = useState(''); const [pagina, setPagina] = useState(1)
    const dados = useCatalogoPublico(tipo, !completo, segmento, q, pagina)
    useEffect(() => {
        let vivo = true
        void httpGet('/public/catalogo/segmentos').then((lista) => {
            if (!vivo) return
            if (Array.isArray(lista)) { setSegmentos(lista); setErroSegmentos(false) }
            else setErroSegmentos(true)
        }).catch(() => { if (vivo) setErroSegmentos(true) })
        return () => { vivo = false }
    }, [httpGet])
    const servicos = tipo === 'servicos'
    const titulo = servicos ? 'Encontre o cuidado que você procura' : 'Especialistas disponíveis'
    const linkTodos = `/${tipo}${segmento ? `?segmento=${encodeURIComponent(segmento)}` : ''}`
    const Titulo = completo ? 'h1' : 'h2'
    const botao = 'min-h-11 rounded-lg border border-border px-4 py-2 font-semibold disabled:opacity-40'
    return <section className="flex flex-col gap-6 text-foreground" aria-label={servicos ? 'Serviços disponíveis' : 'Profissionais disponíveis'}>
        <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl"><p className="text-sm font-semibold text-muted-foreground">{servicos ? 'Serviços' : 'Profissionais'}</p><Titulo className="text-2xl font-bold sm:text-3xl">{titulo}</Titulo><p className="mt-2 text-muted-foreground">{completo ? 'Busque pelo nome, atendimento ou estabelecimento e filtre por segmento.' : 'Conheça uma seleção de estabelecimentos publicados e explore todas as opções quando quiser.'}</p></div>
            {!completo ? <Link href={linkTodos} className={botao}>{servicos ? 'Ver todos os serviços' : 'Ver todos os profissionais'} →</Link> : null}
        </header>
        <div className="flex flex-wrap items-end gap-4">
            {completo ? <label className="grid flex-1 gap-2 text-sm font-semibold">Buscar {servicos ? 'serviços' : 'profissionais'}<input type="search" value={q} maxLength={120} onChange={(e) => { setQ(e.target.value); setPagina(1) }} placeholder="Nome, atendimento ou estabelecimento" className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground" /></label> : null}
            <label className="grid gap-2 text-sm font-semibold">Segmento<select value={segmento} onChange={(e) => { setSegmento(e.target.value); setPagina(1) }} className="min-h-11 max-w-full rounded-lg border border-border bg-background px-3 text-foreground">
                <option value="">Todos os segmentos</option>
                {segmento && !segmentos.some((item) => item.slug === segmento) ? <option value={segmento}>{segmento}</option> : null}
                {segmentos.map((item) => <option key={item.slug} value={item.slug}>{item.nome}</option>)}
            </select></label>
            {q || segmento ? <button type="button" className={botao} onClick={() => { setQ(''); setSegmento(''); setPagina(1) }}>Limpar filtros</button> : null}
        </div>
        {erroSegmentos ? <p role="status" className="text-sm text-muted-foreground">Não foi possível carregar os segmentos. A consulta de todos continua disponível.</p> : null}
        {dados.carregando ? <p role="status">Carregando {tipo}…</p> : dados.erro ? <div role="alert"><p>{dados.erro}</p><button type="button" onClick={dados.carregar} className={`mt-3 ${botao}`}>Tentar novamente</button></div> : <>
            {!dados.resposta?.itens.length ? <p className="rounded-lg border border-border p-5">Nenhuma opção encontrada. Tente outro termo ou segmento.</p> : null}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{dados.resposta?.itens.map((item) => 'preco' in item ? <ItemServico key={item.id} servico={item} estabelecimento={item.estabelecimento} /> : <ItemProfissional key={item.id} profissional={item} estabelecimento={item.estabelecimento} />)}</div>
            {completo && dados.resposta ? <nav aria-label="Paginação do catálogo" className="flex flex-wrap items-center justify-center gap-3">
                <button type="button" disabled={pagina <= 1} className={botao} onClick={() => setPagina((atual) => atual - 1)}>← Anterior</button>
                <p aria-live="polite">Página {pagina} de {Math.max(1, dados.resposta.paginacao.paginas)} · {dados.resposta.paginacao.total} opções</p>
                <button type="button" disabled={pagina >= dados.resposta.paginacao.paginas} className={botao} onClick={() => setPagina((atual) => atual + 1)}>Próxima →</button>
            </nav> : null}
        </>}
    </section>
}
