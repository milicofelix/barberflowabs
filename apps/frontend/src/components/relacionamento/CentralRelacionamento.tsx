'use client'

import { useState } from 'react'
import { acoesRegistroRelacionamento, camposProgramaRelacionamento, canaisRelacionamento, formularioClienteRelacionamento, formularioPreferenciaRelacionamento, formulariosRelacionamento, linhasRelacionamento, registrosRelacionamento, secoesRelacionamento, tituloRegistroRelacionamento, type DadosRelacionamento, type FormularioRelacionamento } from '@uniflowabs/core'
import useCentralRelacionamento from '@/data/hooks/useCentralRelacionamento'
import FormularioCentral, { EdicaoRelacionamento } from './FormularioCentral'
import { formulariosBeneficioRelacionamento, formularioSupressaoRelacionamento, limitePaginaRelacionamento } from '@uniflowabs/core'
import useSessao from '@/data/hooks/useSessao'

const botao = 'min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:border-violet-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
export default function CentralRelacionamento() {
    const { usuario } = useSessao()
    return <ConteudoCentral key={`${usuario?.id}:${usuario?.estabelecimentoId}`} />
}
function ConteudoCentral() {
    const dados = useCentralRelacionamento(); const { store } = dados
    const [busca, setBusca] = useState(''); const [edicao, setEdicao] = useState<EdicaoRelacionamento | null>(null)
    const [inicio, setInicio] = useState(dados.inicio.slice(0, 10)); const [fim, setFim] = useState(dados.fim.slice(0, 10))
    const ler = dados.permissoes.includes('RELACIONAMENTO_VISUALIZAR'); const gerenciar = dados.permissoes.includes('RELACIONAMENTO_GERENCIAR')
    function editar(form: FormularioRelacionamento, registro?: DadosRelacionamento, canal?: string) { setEdicao({ form, registro, canal }) }
    const atual = dados.selecionado
    const formularios = formulariosRelacionamento(dados.secao, dados.clientes, dados.templates).filter(f => dados.secao !== 'fidelidade' || f.caminho.endsWith(`/${dados.grupoFidelidade}`))
    return <section className="flex flex-col gap-5 text-slate-900 dark:text-slate-100">
        <header><h2 className="text-2xl font-bold">Central de relacionamento</h2><p>Clientes, comunicação e fidelização do estabelecimento atual. Contatos importados não autorizam campanhas automaticamente.</p></header>
        <div className="flex flex-wrap gap-2" aria-label="Áreas de relacionamento">{secoesRelacionamento.filter(s => s.id !== 'metricas' || dados.permissoes.includes('FINANCEIRO_VISUALIZAR')).map(s => <button type="button" key={s.id} disabled={dados.salvando || !ler} aria-pressed={dados.secao === s.id} className={`${botao} ${dados.secao === s.id ? '!border-violet-500 !bg-violet-600 !text-white' : ''}`} onClick={() => { setEdicao(null); void store.carregar({ secao: s.id, pagina: 1 }) }}>{s.titulo}</button>)}</div>
        {dados.erro ? <p role="alert" className="rounded-lg bg-red-100 p-3 text-red-900">{dados.erro}</p> : null}
        {dados.mensagem ? <p role="status" className="rounded-lg bg-emerald-100 p-3 text-emerald-900">{dados.mensagem}</p> : null}
        {ler ? <>
            <div className="flex flex-wrap gap-2"><button type="button" className={botao} disabled={dados.carregando || dados.salvando} onClick={() => void store.recarregar()}>Atualizar</button>
                {gerenciar ? formularios.map(form => <button type="button" className={botao} key={form.titulo} disabled={dados.salvando} onClick={() => editar(form)}>{form.titulo}</button>) : null}
                {dados.secao === 'fidelidade' && gerenciar ? <button className={botao} type="button" onClick={() => editar({ titulo: 'Configurar programa', caminho: '/relacionamento/fidelidade/programa', metodo: 'PUT', campos: camposProgramaRelacionamento, aviso: 'Valores em centavos. O programa não concede pontos retroativos.', confirmar: 'Confirmo as regras e a ativação ou desativação do programa.' }, dados.programa)}>Configurar programa</button> : null}
            </div>
            {dados.secao === 'fidelidade' ? <div className="flex flex-wrap gap-2">{(['recompensas', 'cupons', 'indicacoes'] as const).map(grupo => <button type="button" key={grupo} className={botao} aria-pressed={dados.grupoFidelidade === grupo} onClick={() => void store.carregar({ grupoFidelidade: grupo, pagina: 1 })}>{grupo === 'indicacoes' ? 'Indicações' : grupo === 'cupons' ? 'Cupons' : 'Recompensas'}</button>)}</div> : null}
            {dados.secao === 'fidelidade' && dados.permissoes.includes('AGENDA_GERENCIAR') ? <div className="flex flex-wrap gap-2">{formulariosBeneficioRelacionamento().filter(f => gerenciar || f.metodo === 'GET').map(form => <button type="button" className={botao} key={form.titulo} onClick={() => editar(form)}>{form.titulo}</button>)}</div> : null}
            {dados.secao === 'clientes' ? <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void store.carregar({ busca, pagina: 1 }) }}><input aria-label="Pesquisar cliente por nome, e-mail ou telefone" className="min-w-0 flex-1 rounded-lg border bg-white p-3 text-slate-900 dark:bg-slate-900 dark:text-white" placeholder="Nome, e-mail ou telefone" value={busca} onChange={e => setBusca(e.target.value)} /><button className={botao}>Pesquisar</button></form> : null}
            {dados.secao === 'metricas' ? <form className="flex flex-wrap items-end gap-3" onSubmit={e => { e.preventDefault(); void store.carregar({ inicio: new Date(`${inicio}T00:00:00`).toISOString(), fim: new Date(`${fim}T00:00:00`).toISOString() }) }}><label>Início<input required type="date" className={`${botao} block`} value={inicio} onChange={e => setInicio(e.target.value)} /></label><label>Fim exclusivo<input required type="date" className={`${botao} block`} value={fim} onChange={e => setFim(e.target.value)} /></label><button className={botao}>Consultar período</button><p className="w-full text-sm">Até 93 dias. Datas no fuso deste dispositivo; as duas plataformas enviam instantes ISO.</p></form> : null}
            {dados.carregando ? <p role="status">Carregando…</p> : null}
            {dados.secao === 'fidelidade' ? <div className="rounded-xl border p-4"><h3 className="font-bold">Programa {dados.programa.ativo ? 'ativo' : 'inativo'}</h3><p>Validade: {String(dados.programa.validadeDias ?? '—')} dias · {String(dados.programa.centavosPorPonto ?? '—')} centavos por ponto. Ofertas cadastradas e indicações abaixo.</p></div> : null}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{dados.itens.map((item, indice) => <article key={String(item.chaveRegistro ?? item.id ?? indice)} className="min-w-0 rounded-xl border border-slate-300 p-4 dark:border-slate-600"><h3 className="font-bold">{tituloRegistroRelacionamento(item)}</h3><p className="my-2 text-sm">{String(item.tipoRegistro ?? item.canal ?? '')} · {String(item.status ?? (item.ativo === undefined ? '' : item.ativo ? 'Ativo' : 'Inativo'))}</p>{dados.secao === 'metricas' ? <Leitura dados={item} /> : <button className={botao} type="button" disabled={dados.carregando} onClick={() => void store.selecionar(item)}>Ver detalhes</button>}</article>)}</div>
            {!dados.carregando && !dados.itens.length ? <p>Nenhum registro encontrado nesta área.</p> : null}
            {dados.secao !== 'metricas' ? <div className="flex items-center gap-3"><button type="button" className={botao} disabled={dados.pagina <= 1 || dados.carregando} onClick={() => void store.carregar({ pagina: dados.pagina - 1 })}>Anterior</button><span>Página {dados.pagina}</span><button type="button" className={botao} disabled={dados.carregando || dados.pagina * limitePaginaRelacionamento(dados) >= dados.total} onClick={() => void store.carregar({ pagina: dados.pagina + 1 })}>Próxima</button></div> : null}
            {atual ? <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-4"><section role="dialog" aria-modal="true" className="flex max-h-[85dvh] w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-xl border-2 border-violet-400 bg-white p-4 dark:bg-slate-900" aria-label="Detalhes do relacionamento"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-xl font-bold">{tituloRegistroRelacionamento(atual)}</h3><button autoFocus className={botao} type="button" disabled={dados.salvando} onClick={() => void store.selecionar(null)}>Fechar detalhes</button></div>
                {dados.erro ? <p role="alert" className="rounded-lg bg-red-100 p-3 text-red-900">{dados.erro}</p> : null}
                {dados.carregando ? <p role="status">Carregando detalhes…</p> : null}
                {gerenciar && dados.detalhe ? <div className="flex flex-wrap gap-2">
                    {dados.secao === 'clientes' ? <button type="button" className={botao} onClick={() => editar(formularioSupressaoRelacionamento(Number(atual.id)))}>Supressão de campanhas</button> : null}
                    {dados.secao === 'campanhas' && atual.status === 'RASCUNHO' && !atual.audienciaCongeladaEm ? <button type="button" className={botao} onClick={() => editar({ ...formulariosRelacionamento('campanhas', [], dados.templates)[0]!, titulo: 'Editar rascunho', metodo: 'PUT', caminho: `/relacionamento/campanhas/${atual.id}` }, atual)}>Editar rascunho</button> : null}
                    {dados.secao === 'clientes' ? <><button type="button" className={botao} onClick={() => editar(formularioClienteRelacionamento(atual), atual)}>Editar relacionamento</button>{canaisRelacionamento.map(canal => <button className={botao} type="button" key={canal} onClick={() => editar(formularioPreferenciaRelacionamento(Number(atual.id), canal), registrosRelacionamento(dados.detalhe?.preferencias).find(p => p.canal === canal), canal)}>Preferência {canal}</button>)}</> : null}
                    {acoesRegistroRelacionamento(dados.secao, atual).map(acao => <button className={botao} type="button" key={acao.titulo} disabled={dados.salvando} onClick={() => editar(acao.formulario ?? { titulo: acao.titulo, caminho: acao.caminho, metodo: 'POST', campos: [], confirmar: acao.confirmar }, atual)}>{acao.titulo}</button>)}
                </div> : null}
                {dados.detalhe ? <Leitura dados={dados.detalhe} /> : null}
                {dados.totalDetalhe > 0 ? <div className="flex gap-3"><button type="button" className={botao} disabled={dados.paginaDetalhe <= 1 || dados.carregando} onClick={() => void store.selecionar(atual, dados.paginaDetalhe - 1)}>Anterior</button><span>Página de detalhes {dados.paginaDetalhe}</span><button type="button" className={botao} disabled={dados.carregando || dados.paginaDetalhe * (dados.secao === 'clientes' ? 50 : 25) >= dados.totalDetalhe} onClick={() => void store.selecionar(atual, dados.paginaDetalhe + 1)}>Próxima</button></div> : null}
            </section></div> : null}
        </> : null}
        {edicao && (gerenciar || edicao.form.metodo === 'GET') ? <FormularioCentral key={`${edicao.form.caminho}:${edicao.canal ?? ''}`} edicao={edicao} ocupado={dados.salvando} erro={dados.erro} fechar={() => setEdicao(null)} salvar={valores => store.salvar(edicao.form, valores, edicao.canal)} /> : null}
    </section>
}
function Leitura({ dados }: { dados: DadosRelacionamento }) {
    return <dl className="grid max-h-[500px] gap-3 overflow-y-auto break-words text-sm sm:grid-cols-2">{linhasRelacionamento(dados).map((linha, i) => <div key={`${linha.titulo}:${i}`}><dt className="text-slate-500 dark:text-slate-400">{linha.titulo}</dt><dd className="whitespace-pre-wrap">{linha.valor}</dd></div>)}</dl>
}
