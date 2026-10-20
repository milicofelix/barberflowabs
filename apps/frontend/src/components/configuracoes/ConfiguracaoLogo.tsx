'use client'

import { useEffect, useState } from 'react'
import { OPCOES_LOGO_ESTABELECIMENTO, type ConfiguracaoLogoEstabelecimento } from '@uniflowabs/core'
import useAPI from '@/data/hooks/useAPI'
import useSessao from '@/data/hooks/useSessao'
import SeletorImagem from '@/components/midia/SeletorImagem'

export default function ConfiguracaoLogo() {
    const { usuario } = useSessao()
    const dono = String(usuario?.papel ?? usuario?.role).toUpperCase() === 'ESTABLISHMENT_OWNER'
    const { httpGet, httpPut } = useAPI()
    const [config, setConfig] = useState<ConfiguracaoLogoEstabelecimento | null>(null)
    const [midiaId, setMidiaId] = useState<string>()
    const [salvando, setSalvando] = useState(false)
    const [mensagem, setMensagem] = useState('')
    useEffect(() => {
        setConfig(null); setMidiaId(undefined); setMensagem('')
        if (!dono) return
        let vigente = true
        httpGet('/estabelecimentos/minha/logo').then((r) => {
            if (!vigente) return
            if (r?.statusCode || !r?.id) setMensagem(r?.message ?? 'Não foi possível carregar o logo.')
            else setConfig(r)
        }).catch(() => { if (vigente) setMensagem('Não foi possível carregar o logo.') })
        return () => { vigente = false }
    }, [dono, usuario?.estabelecimentoId, httpGet])
    if (!dono) return null
    async function salvar() {
        if (!config || salvando) return
        setSalvando(true); setMensagem('')
        try {
            const r = await httpPut('/estabelecimentos/minha/logo', { logoModo: config.logoModo, midiaId })
            if (r?.statusCode || !r?.id) { setMensagem(r?.message ?? 'Não foi possível salvar o logo.'); return }
            setConfig(r); setMidiaId(undefined); setMensagem('Logo atualizado.')
            window.dispatchEvent(new Event('uniflow:identidade-atualizada'))
        } catch { setMensagem('Não foi possível salvar o logo.') } finally { setSalvando(false) }
    }
    return <section className="grid gap-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-xl font-bold">Logo do estabelecimento</h2>
        <p className="text-sm text-muted-foreground">Personalize a marca ou deixe a área sem logo se ele já estiver no banner. A capa não será alterada.</p>
        {config ? <><fieldset disabled={salvando} className="flex flex-wrap gap-3"><legend className="sr-only">Exibição do logo</legend>
            {OPCOES_LOGO_ESTABELECIMENTO.map((o) => <label key={o.modo} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3"><input type="radio" name="logo-unidade" value={o.modo} checked={config.logoModo === o.modo} onChange={() => setConfig({ ...config, logoModo: o.modo })} />{o.titulo}</label>)}
        </fieldset>
        {config.logoModo === 'PERSONALIZADO' ? <SeletorImagem finalidade="LOGO" titulo="Enviar ou escolher seu logo" valor={config.logoURL} disabled={salvando} alterar={(url, id) => { setConfig({ ...config, logoURL: url }); setMidiaId(id ?? undefined); setMensagem('') }} /> : null}
        <p className="text-sm text-muted-foreground">PNG transparente é recomendado. JPEG, PNG ou WebP, até 5 MB, sem recorte.</p>
        <button type="button" onClick={salvar} disabled={salvando || config.logoModo === 'PERSONALIZADO' && !config.logoURL} className="w-fit rounded-lg bg-violet-600 px-4 py-3 font-bold text-white disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar logo'}</button></> : null}
        {mensagem ? <p role="status">{mensagem}</p> : null}
    </section>
}
