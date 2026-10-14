'use client'
import { useEffect, useState } from 'react'
import useSessao from '@/data/hooks/useSessao'
import useAPI from '@/data/hooks/useAPI'
import SeletorImagem from './SeletorImagem'

export default function MinhaFoto() {
    const { usuario, renovarSessao } = useSessao()
    const { httpPut } = useAPI()
    const [url, setUrl] = useState(usuario?.fotoURL ?? '')
    const [midiaId, setMidiaId] = useState<string | null | undefined>()
    const [mensagem, setMensagem] = useState('')
    const [salvando, setSalvando] = useState(false)
    useEffect(() => { setUrl(usuario?.fotoURL ?? '') }, [usuario?.fotoURL])
    async function salvar() {
        if (midiaId === undefined || salvando) return
        setSalvando(true); setMensagem('')
        try {
            const resposta = await httpPut('/midias/associacao', { entidade: 'USUARIO', midiaId })
            if (resposta?.statusCode !== undefined) throw new Error(resposta.message)
            setMidiaId(undefined)
            const atualizada = await renovarSessao()
            setMensagem(atualizada ? 'Foto atualizada.' : 'Foto salva. Atualize a sessão para exibi-la no menu.')
        } catch (e: any) { setMensagem(e.message) } finally { setSalvando(false) }
    }
    return <section className="grid max-w-lg gap-4 rounded-xl border border-border bg-card p-5 text-foreground"><h2 className="text-xl font-bold">Minha foto</h2><p className="text-sm">Escolha uma foto para sua conta. Ela será exibida no seu perfil.</p>
        <SeletorImagem titulo="Foto pessoal" finalidade="AVATAR" valor={url} disabled={salvando} alterar={(valor, id) => { setUrl(valor); setMidiaId(id); setMensagem('') }} />
        <button type="button" disabled={midiaId === undefined || salvando} onClick={salvar} className="rounded-lg bg-violet-600 px-4 py-3 font-bold text-white disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar foto'}</button>
        {mensagem && <p role="status">{mensagem}</p>}
    </section>
}
