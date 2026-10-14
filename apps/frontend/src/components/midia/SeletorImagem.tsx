'use client'
import { useEffect, useId, useRef, useState } from 'react'
import useAPI from '@/data/hooks/useAPI'
import type { FinalidadeMidia, ImagemGaleria } from '@uniflowabs/core'
import { resolverURLMidia } from '@uniflowabs/core'

export function urlImagemWeb(url?: string | null) {
    return resolverURLMidia(url ?? '', process.env.NEXT_PUBLIC_API_URL ?? '')
}

export default function SeletorImagem({ valor, finalidade, alterar, titulo = 'Imagem', padrao = '', disabled = false }: {
    valor?: string | null; finalidade: FinalidadeMidia; alterar: (url: string, midiaId: string | null) => void
    titulo?: string; padrao?: string; disabled?: boolean
}) {
    const { httpGet, httpUpload } = useAPI()
    const dialog = useRef<HTMLDialogElement>(null)
    const id = useId()
    const [aberto, setAberto] = useState(false)
    const [galeria, setGaleria] = useState<ImagemGaleria[]>([])
    const [segmento, setSegmento] = useState('')
    const [erro, setErro] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [progresso, setProgresso] = useState(0)
    const [foto, setFoto] = useState<string | null>(null)
    const [posicao, setPosicao] = useState({ x: 50, y: 50 })
    const [falhou, setFalhou] = useState(false)
    const [tentativa, setTentativa] = useState(0)
    const proporcao = finalidade === 'CAPA' || finalidade === 'SERVICO' ? 16 / 9 : 1
    const nomesSegmentos: Record<string, string> = { barbearia: 'Barbearia', 'salao-beleza': 'Salão de cabelo', 'manicure-pedicure': 'Manicure e pedicure', 'clinica-estetica': 'Clínica de estética', 'spa-bem-estar': 'Spa e bem-estar', beleza: 'Estética e beleza' }
    useEffect(() => { setFalhou(false) }, [valor])
    useEffect(() => { return () => { if (foto) URL.revokeObjectURL(foto) } }, [foto])
    useEffect(() => {
        if (!aberto) return
        let vigente = true
        setCarregando(true); setErro(''); setGaleria([])
        httpGet(`/midias/galeria?finalidade=${finalidade}`).then((dados) => {
            if (!vigente) return
            if (!Array.isArray(dados)) setErro(dados?.message ?? 'Galeria indisponível')
            else setGaleria(dados)
        }).finally(() => { if (vigente) setCarregando(false) })
        return () => { vigente = false }
    }, [aberto, finalidade, httpGet, tentativa])
    function abrir() { setAberto(true); setFoto(null); setErro(''); dialog.current?.showModal() }
    function fechar() { if (enviando) return; dialog.current?.close(); setAberto(false); setFoto(null) }
    function escolherArquivo(arquivo?: File) {
        if (!arquivo) return
        if (arquivo.size > 5 * 1024 * 1024) { setErro('Selecione uma foto de até 5 MB.'); return }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) { setErro('Use uma foto JPEG, PNG ou WebP.'); return }
        setErro(''); setPosicao({ x: 50, y: 50 }); setFoto(URL.createObjectURL(arquivo))
    }
    async function enviar() {
        if (!foto || enviando) return
        setEnviando(true); setErro(''); setProgresso(0)
        try {
            const imagem = new Image(); imagem.src = foto; await imagem.decode()
            const largura = finalidade === 'SERVICO' ? imagem.naturalWidth : Math.min(imagem.naturalWidth, imagem.naturalHeight * proporcao)
            const altura = finalidade === 'SERVICO' ? imagem.naturalHeight : largura / proporcao
            const escala = Math.min(1, (finalidade === 'CAPA' ? 1600 : 800) / Math.max(largura, altura))
            const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(largura * escala)); canvas.height = Math.max(1, Math.round(altura * escala))
            const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Não foi possível preparar a foto')
            ctx.drawImage(imagem, (imagem.naturalWidth - largura) * posicao.x / 100, (imagem.naturalHeight - altura) * posicao.y / 100, largura, altura, 0, 0, canvas.width, canvas.height)
            const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Não foi possível preparar a foto')), 'image/webp', 0.85))
            const midia = await httpUpload(new File([blob], 'foto.webp', { type: 'image/webp' }), finalidade, setProgresso)
            alterar(midia.versoes.principal.url, midia.id)
            dialog.current?.close(); setAberto(false); setFoto(null)
        } catch (e: any) { setErro(e.message ?? 'Não foi possível enviar a foto') } finally { setEnviando(false) }
    }
    return <div className="grid gap-2">
        <span className="text-sm font-semibold text-foreground">{titulo}</span>
        {valor && !falhou ? <img alt={titulo} src={urlImagemWeb(valor)} onError={() => setFalhou(true)} className="max-h-48 w-full rounded-xl border border-border bg-card" style={{ aspectRatio: proporcao, objectFit: finalidade === 'SERVICO' ? 'contain' : 'cover' }} /> : <div className="grid h-28 place-items-center rounded-xl border border-border bg-card text-sm text-muted-foreground">Imagem padrão</div>}
        <div className="flex flex-wrap gap-2"><button type="button" disabled={disabled} onClick={abrir} className="rounded-lg border border-border px-3 py-2 text-foreground">Escolher imagem ou enviar foto</button>
            <button type="button" disabled={disabled} onClick={() => alterar(padrao, null)} className="rounded-lg border border-border px-3 py-2 text-foreground">Usar padrão</button></div>
        <dialog ref={dialog} aria-labelledby={id} onCancel={(e) => { if (enviando) e.preventDefault(); else { setAberto(false); setFoto(null) } }} className="w-[min(94vw,760px)] max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background p-5 text-foreground backdrop:bg-black/60">
            <div className="flex items-center justify-between gap-3"><h2 id={id} className="text-xl font-bold">{foto ? 'Enquadrar foto' : titulo}</h2><button type="button" disabled={enviando} onClick={fechar} className="rounded-lg border border-border px-3 py-2">Fechar</button></div>
            {erro && <p role="alert" className="mt-3 text-red-500">{erro}</p>}
            {foto ? <div className="mt-4 grid gap-3"><img src={foto} alt="Prévia do enquadramento" className="mx-auto w-full max-w-sm bg-card" style={{ aspectRatio: proporcao, objectFit: finalidade === 'SERVICO' ? 'contain' : 'cover', objectPosition: `${posicao.x}% ${posicao.y}%` }} />
                {finalidade !== 'SERVICO' && <><label>Posição horizontal<input disabled={enviando} aria-label="Posição horizontal" type="range" min={0} max={100} value={posicao.x} onChange={(e) => setPosicao({ ...posicao, x: Number(e.target.value) })} className="w-full" /></label>
                <label>Posição vertical<input disabled={enviando} aria-label="Posição vertical" type="range" min={0} max={100} value={posicao.y} onChange={(e) => setPosicao({ ...posicao, y: Number(e.target.value) })} className="w-full" /></label></>}
                {enviando && <label role="status">{progresso === 100 ? 'Processando imagem...' : `Enviando ${progresso}%`}<progress value={progresso} max={100} className="w-full" /></label>}
                <button type="button" disabled={enviando} onClick={enviar} className="rounded-lg bg-violet-600 px-4 py-3 font-bold text-white">{enviando ? 'Enviando...' : 'Usar esta foto'}</button>
                <button type="button" disabled={enviando} onClick={() => setFoto(null)}>Voltar à galeria</button>
            </div> : <div className="mt-4 grid gap-4">
                <label className="grid gap-2">Enviar foto (até 5 MB)<input disabled={enviando} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { escolherArquivo(e.target.files?.[0]); e.target.value = '' }} /></label>
                <label>Segmento<select className="input ml-2" value={segmento} onChange={(e) => setSegmento(e.target.value)}><option value="">Todos</option>{Array.from(new Set(galeria.map((item) => item.segmentoSlug).filter((s): s is string => !!s))).map((s) => <option key={s} value={s}>{nomesSegmentos[s] ?? s.replace(/-/g, ' ')}</option>)}</select></label>
                {carregando && <p role="status">Carregando galeria...</p>}
                {erro && <button type="button" onClick={() => setTentativa((t) => t + 1)}>Tentar carregar novamente</button>}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{galeria.filter((item) => !segmento || !item.segmentoSlug || item.segmentoSlug === segmento).map((item) => <button type="button" key={item.id} onClick={() => { alterar(item.versoes.principal.url, item.id); fechar() }} className="rounded-xl border border-border p-2 text-left hover:border-violet-500"><img src={urlImagemWeb(item.versoes.miniatura.url)} alt="" className="aspect-video w-full rounded-lg bg-card object-contain" /><span className="mt-2 block text-sm">{item.titulo}</span></button>)}</div>
                {!carregando && !erro && !galeria.length && <p>Nenhuma imagem disponível. Você pode enviar sua própria foto.</p>}
            </div>}
        </dialog>
    </div>
}
