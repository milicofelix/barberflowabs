import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { EntidadeMidia, FinalidadeMidia } from '@uniflowabs/core'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import SeletorImagem from './SeletorImagem'

export default function ImagemRegistro({ valor, entidade, entidadeId, finalidade, titulo, aoSalvar }: {
    valor?: string | null; entidade: EntidadeMidia; entidadeId?: number; finalidade: FinalidadeMidia
    titulo: string; aoSalvar?: () => unknown | Promise<unknown>
}) {
    const { httpPut } = useAPI(); const { cores } = useTema()
    const [url, setUrl] = useState(valor ?? ''); const [midiaId, setMidiaId] = useState<string | null | undefined>()
    const [salvando, setSalvando] = useState(false); const [mensagem, setMensagem] = useState('')
    useEffect(() => { setUrl(valor ?? ''); setMidiaId(undefined) }, [valor, entidadeId])
    async function salvar() {
        if (midiaId === undefined || salvando) return
        setSalvando(true); setMensagem('')
        try {
            await httpPut('/midias/associacao', { entidade, entidadeId, midiaId })
            setMidiaId(undefined); setMensagem('Imagem salva.'); await aoSalvar?.()
        } catch (e) { setMensagem(mensagemDoErro(e)) } finally { setSalvando(false) }
    }
    return <View style={{ gap: 8 }}><SeletorImagem valor={url} finalidade={finalidade} titulo={titulo} disabled={salvando} alterar={(imagem, id) => { setUrl(imagem); setMidiaId(id); setMensagem('') }} />
        <Pressable accessibilityRole="button" disabled={salvando || midiaId === undefined} onPress={salvar} style={{ minHeight: 48, padding: 12, borderRadius: 10, backgroundColor: cores.destaque, opacity: salvando || midiaId === undefined ? 0.5 : 1 }}><Text style={{ color: cores.destaqueTexto, fontWeight: '800' }}>{salvando ? 'Salvando...' : 'Salvar imagem'}</Text></Pressable>
        {mensagem ? <Text accessibilityRole="text" style={{ color: cores.texto }}>{mensagem}</Text> : null}
    </View>
}
