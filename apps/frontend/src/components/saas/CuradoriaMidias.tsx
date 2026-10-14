'use client'
import { useState } from 'react'
import useAPI from '@/data/hooks/useAPI'
import SeletorImagem, { urlImagemWeb } from '@/components/midia/SeletorImagem'
import type { FinalidadeMidia, ImagemGaleria } from '@uniflowabs/core'

type ImagemAdmin = ImagemGaleria & { ativo: boolean }
export default function CuradoriaMidias() {
    const { httpGet, httpPut } = useAPI()
    const [aberto, setAberto] = useState(false), [ocupado, setOcupado] = useState(false), [erro, setErro] = useState('')
    const [dados, setDados] = useState<{ itens: ImagemAdmin[]; segmentos: Array<{ slug: string; nome: string }>; auditoria: any[] } | null>(null)
    const [form, setForm] = useState<ImagemAdmin | null>(null), [finalidade, setFinalidade] = useState<FinalidadeMidia>('SERVICO')
    async function carregar(id?: string | null) {
        setOcupado(true); setErro('')
        try {
            const resposta = await httpGet('/midias/admin')
            if (!Array.isArray(resposta?.itens)) throw new Error(resposta?.message ?? 'Galeria indisponível')
            setDados(resposta); if (id) setForm(resposta.itens.find((item: ImagemAdmin) => item.id === id) ?? null)
        } catch (e: any) { setErro(e.message) } finally { setOcupado(false) }
    }
    async function salvar() {
        if (!form || ocupado) return
        setOcupado(true); setErro('')
        try {
            const resposta = await httpPut(`/midias/admin/${form.id}`, { titulo: form.titulo, segmentoSlug: form.segmentoSlug, ativo: form.ativo })
            if (resposta?.statusCode) throw new Error(resposta.message)
            setForm(null); await carregar()
        } catch (e: any) { setErro(e.message) } finally { setOcupado(false) }
    }
    return <section className="rounded-xl border border-border bg-card p-5 text-foreground">
        <button type="button" onClick={() => { setAberto(!aberto); if (!aberto) void carregar() }} className="font-bold">Galeria global — curadoria {aberto ? '▴' : '▾'}</button>
        {aberto && <div className="mt-4 grid gap-4">
            <p className="text-sm text-muted-foreground">Somente imagens globais. Desativar impede novas seleções; referências existentes continuam funcionando. Upload global fica disponível imediatamente.</p>
            {erro && <p role="alert" className="text-red-500">{erro}</p>}
            <button disabled={ocupado} onClick={() => carregar()} className="rounded border p-2">{ocupado ? 'Processando...' : 'Atualizar galeria'}</button>
            <label>Finalidade da nova imagem<select className="input ml-2" value={finalidade} onChange={(e) => setFinalidade(e.target.value as FinalidadeMidia)}>{['SERVICO', 'CAPA', 'PROFISSIONAL', 'AVATAR'].map((uso) => <option key={uso}>{uso}</option>)}</select></label>
            <SeletorImagem global finalidade={finalidade} titulo="Enviar nova imagem global ou selecionar para editar" disabled={ocupado} alterar={(_, id) => { if (id) void carregar(id) }} />
            {form && <div className="grid gap-3 rounded border border-border p-4">
                <img src={urlImagemWeb(form.versoes.principal.url)} alt={form.titulo} className="h-32 w-full object-contain" />
                <label>Título<input maxLength={120} className="input w-full" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></label>
                <p className="text-sm">Finalidade: {form.finalidade} (não alterável)</p>
                <label>Segmento<select className="input w-full" value={form.segmentoSlug ?? ''} onChange={(e) => setForm({ ...form, segmentoSlug: e.target.value || null })}><option value="">Todos / neutro</option>{dados?.segmentos.map((s) => <option key={s.slug} value={s.slug}>{s.nome}</option>)}</select></label>
                <label><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Disponível para novas seleções</label>
                <button disabled={ocupado} onClick={salvar} className="rounded bg-violet-600 p-3 font-bold text-white">Salvar curadoria</button>
            </div>}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{dados?.itens.map((item) => <button key={item.id} disabled={ocupado} onClick={() => setForm(item)} className="rounded border border-border p-3 text-left"><img src={urlImagemWeb(item.versoes.miniatura.url)} alt="" className="h-24 w-full object-contain" /><strong>{item.titulo}</strong><p className="text-xs">{item.finalidade} · {item.segmentoSlug ?? 'Neutro'} · {item.ativo ? 'Ativa' : 'Desativada'}</p></button>)}</div>
            {!ocupado && dados && !dados.itens.length && <p>Galeria vazia. Envie uma imagem ou execute o seed inicial.</p>}
            <details><summary>Auditoria recente de curadoria</summary>{dados?.auditoria.map((a) => <p key={a.id} className="text-xs">{new Date(a.createdAt).toLocaleString('pt-BR')} · {a.acao} · {a.entidadeId} · autor #{a.usuarioId}</p>)}</details>
        </div>}
    </section>
}
