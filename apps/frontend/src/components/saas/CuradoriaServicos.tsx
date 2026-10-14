'use client'

import { useState } from 'react'
import useAPI from '@/data/hooks/useAPI'

const inicial = { nome: '', slug: '', descricao: '', imagemURL: '/servicos/combo.jpg', segmentoId: 0, especialidadeIds: [] as number[], ativo: false, ordem: 0, modeloAtendimento: 'PRESENCIAL', duracaoMinutos: 30, preparoAntesMinutos: 0, preparoDepoisMinutos: 0, deslocamentoMinutos: 0, requisitosOperacionais: [] as Array<{ requisitoId: number; obrigatorio: boolean }>, recursosNecessarios: [] as Array<{ tipoRecurso: string; quantidade: number }> }

export default function CuradoriaServicos() {
    const { httpGet, httpPost, httpPut } = useAPI()
    const [aberto, setAberto] = useState(false)
    const [dados, setDados] = useState<any>(null)
    const [form, setForm] = useState<any>(null)
    const [erro, setErro] = useState('')
    const [ocupado, setOcupado] = useState(false)
    const [busca, setBusca] = useState('')
    async function carregar() {
        setOcupado(true); setErro('')
        try {
            const resposta = await httpGet('/catalogo/admin')
            if (resposta?.statusCode) throw new Error(resposta.message)
            setDados(resposta)
        } catch (e: any) { setErro(e.message) } finally { setOcupado(false) }
    }
    async function salvar() {
        setOcupado(true); setErro('')
        try {
            const resposta = form.id ? await httpPut(`/catalogo/admin/${form.id}`, form) : await httpPost('/catalogo/admin', form)
            if (resposta?.statusCode) throw new Error(resposta.message)
            setForm(null); await carregar()
        } catch (e: any) { setErro(e.message) } finally { setOcupado(false) }
    }
    function editar(item: any) {
        setForm({ ...item, especialidadeIds: item.especialidades.map((e: any) => e.especialidadeId), requisitosOperacionais: item.requisitosOperacionais ?? [], recursosNecessarios: item.recursosNecessarios ?? [] })
    }
    const campo = (chave: string, rotulo: string, numero = false) => <label key={chave} className="grid gap-1 text-sm">{rotulo}<input className="input" type={numero ? 'number' : 'text'} value={form[chave]} onChange={(e) => setForm({ ...form, [chave]: numero ? Number(e.target.value) : e.target.value })} /></label>
    return <section className="rounded-xl border border-border bg-surface p-5 text-foreground">
        <button type="button" className="font-bold" aria-expanded={aberto} onClick={() => { setAberto(!aberto); if (!aberto) void carregar() }}>Catálogo global de serviços · {aberto ? 'Recolher' : 'Gerenciar'}</button>
        {aberto && <div className="mt-4 grid gap-4">
            {erro && <p role="alert" className="text-red-500">{erro}</p>}
            {ocupado && <p>Processando...</p>}
            {dados && <>
                <div className="rounded border border-border p-3"><h3 className="font-bold">Sugestões mais adotadas</h3><p className="text-sm">Total de serviços importados ainda cadastrados. Apenas quantidades agregadas são exibidas.</p>{[...dados.itens].sort((a: any, b: any) => b.adocoes - a.adocoes).slice(0, 5).map((item: any) => <p key={item.id} className="text-sm">{item.nome}: {item.adocoes}</p>)}</div>
                <div className="flex flex-wrap gap-3"><input aria-label="Buscar sugestão" placeholder="Buscar serviço" className="input" value={busca} onChange={(e) => setBusca(e.target.value)} /><button disabled={ocupado} onClick={() => setForm({ ...inicial, segmentoId: dados.segmentos[0]?.id ?? 0 })} className="rounded bg-violet-600 px-4 py-2 text-white">Nova sugestão</button></div>
                {!form ? <div className="grid gap-2 md:grid-cols-2">{dados.itens.filter((item: any) => item.nome.toLowerCase().includes(busca.toLowerCase())).map((item: any) => <button disabled={ocupado} key={item.id} onClick={() => editar(item)} className="rounded border border-border p-3 text-left"><strong>{item.nome}</strong><p className="text-sm">{item.ativo ? 'Ativo' : 'Desativado'} · Ordem {item.ordem} · {item.adocoes} adoção(ões)</p><p className="text-sm">{dados.segmentos.find((s: any) => s.id === item.segmentoId)?.nome}</p></button>)}</div> : <div className="grid gap-4">
                    <h3 className="font-bold">{form.id ? 'Editar sugestão' : 'Nova sugestão'}</h3>
                    <div className="grid gap-3 md:grid-cols-2">{campo('nome', 'Nome')}{campo('slug', 'Identificador (ex.: corte-social)')}{campo('descricao', 'Descrição')}{campo('imagemURL', 'Imagem (caminho ou URL HTTPS)')}
                        <label className="grid gap-1">Segmento<select className="input" value={form.segmentoId} onChange={(e) => setForm({ ...form, segmentoId: Number(e.target.value), especialidadeIds: [] })}>{dados.segmentos.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></label>
                        <label className="grid gap-1">Modalidade<select className="input" value={form.modeloAtendimento} onChange={(e) => setForm({ ...form, modeloAtendimento: e.target.value })}>{['PRESENCIAL', 'DOMICILIAR', 'HIBRIDO'].map((m) => <option key={m}>{m}</option>)}</select></label>
                        {campo('ordem', 'Ordem de exibição', true)}{campo('duracaoMinutos', 'Duração (min)', true)}{campo('preparoAntesMinutos', 'Preparação antes (min)', true)}{campo('preparoDepoisMinutos', 'Preparação depois (min)', true)}{campo('deslocamentoMinutos', 'Deslocamento (min)', true)}
                    </div>
                    <label><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Disponível para importação</label>
                    <fieldset className="flex flex-wrap gap-3"><legend>Especialidades</legend>{dados.segmentos.find((s: any) => s.id === form.segmentoId)?.especialidades.filter((e: any) => e.ativo).map((e: any) => <label key={e.id}><input type="checkbox" checked={form.especialidadeIds.includes(e.id)} onChange={(v) => setForm({ ...form, especialidadeIds: v.target.checked ? [...form.especialidadeIds, e.id] : form.especialidadeIds.filter((id: number) => id !== e.id) })} /> {e.nome}</label>)}</fieldset>
                    <fieldset className="grid gap-2"><legend>Requisitos do atendimento</legend>{dados.requisitos.map((r: any) => {
                        const atual = form.requisitosOperacionais.find((item: any) => item.requisitoId === r.id)
                        return <div key={r.id}><label><input type="checkbox" checked={!!atual} onChange={(e) => setForm({ ...form, requisitosOperacionais: e.target.checked ? [...form.requisitosOperacionais, { requisitoId: r.id, obrigatorio: true }] : form.requisitosOperacionais.filter((item: any) => item.requisitoId !== r.id) })} /> {r.nome}</label>{atual && <label className="ml-4"><input type="checkbox" checked={atual.obrigatorio} onChange={(e) => setForm({ ...form, requisitosOperacionais: form.requisitosOperacionais.map((item: any) => item.requisitoId === r.id ? { ...item, obrigatorio: e.target.checked } : item) })} /> Obrigatório</label>}</div>
                    })}</fieldset>
                    <fieldset className="grid gap-2"><legend>Recursos necessários</legend>{form.recursosNecessarios.map((r: any, indice: number) => <div key={indice} className="flex flex-wrap gap-2"><input aria-label="Tipo de recurso" className="input" placeholder="Ex.: MACA" value={r.tipoRecurso} onChange={(e) => setForm({ ...form, recursosNecessarios: form.recursosNecessarios.map((item: any, i: number) => i === indice ? { ...item, tipoRecurso: e.target.value.toUpperCase().replace(/\s/g, '_') } : item) })} /><input aria-label="Quantidade de recursos" className="input" type="number" min={1} value={r.quantidade} onChange={(e) => setForm({ ...form, recursosNecessarios: form.recursosNecessarios.map((item: any, i: number) => i === indice ? { ...item, quantidade: Number(e.target.value) } : item) })} /><button onClick={() => setForm({ ...form, recursosNecessarios: form.recursosNecessarios.filter((_: any, i: number) => i !== indice) })}>Remover</button></div>)}<button onClick={() => setForm({ ...form, recursosNecessarios: [...form.recursosNecessarios, { tipoRecurso: '', quantidade: 1 }] })}>+ Adicionar recurso</button></fieldset>
                    <p className="text-sm">As alterações valem para novas importações. Serviços já adicionados às unidades preservam seus dados.</p>
                    <div className="flex gap-3"><button disabled={ocupado} onClick={salvar} className="rounded bg-violet-600 px-5 py-3 text-white">Salvar sugestão</button><button disabled={ocupado} onClick={() => setForm(null)}>Cancelar</button></div>
                </div>}
                <details><summary>Auditoria das últimas 50 alterações</summary>{dados.auditoria.map((log: any) => <p key={log.id} className="mt-2 text-sm">{new Date(log.createdAt).toLocaleString('pt-BR')} · {log.acao} · sugestão {log.entidadeId} · administrador #{log.usuarioId}</p>)}</details>
            </>}
        </div>}
    </section>
}
