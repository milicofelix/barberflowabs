import { useState } from 'react'
import { Image, Pressable, Switch, Text, View } from 'react-native'
import CampoTexto from '@/src/components/shared/CampoTexto'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import SeletorImagem, { urlMidia } from './SeletorImagem'
import type { FinalidadeMidia, ImagemGaleria } from '@uniflowabs/core'

type ImagemAdmin = ImagemGaleria & { ativo: boolean }
export default function CuradoriaMidias() {
    const { httpGet, httpPut } = useAPI(); const { cores } = useTema()
    const [aberto, setAberto] = useState(false), [ocupado, setOcupado] = useState(false), [erro, setErro] = useState('')
    const [dados, setDados] = useState<{ itens: ImagemAdmin[]; segmentos: Array<{ slug: string; nome: string }>; auditoria: any[] } | null>(null)
    const [form, setForm] = useState<ImagemAdmin | null>(null), [finalidade, setFinalidade] = useState<FinalidadeMidia>('SERVICO')
    async function carregar(id?: string | null) {
        setOcupado(true); setErro('')
        try { const resposta = await httpGet<NonNullable<typeof dados>>('/midias/admin'); setDados(resposta); if (id) setForm(resposta.itens.find((item) => item.id === id) ?? null) }
        catch (e) { setErro(mensagemDoErro(e)) } finally { setOcupado(false) }
    }
    async function salvar() {
        if (!form || ocupado) return
        setOcupado(true); setErro('')
        try { await httpPut(`/midias/admin/${form.id}`, { titulo: form.titulo, segmentoSlug: form.segmentoSlug, ativo: form.ativo }); setForm(null); await carregar() }
        catch (e) { setErro(mensagemDoErro(e)) } finally { setOcupado(false) }
    }
    const botao = (texto: string, acao: () => void) => <Pressable accessibilityRole="button" disabled={ocupado} onPress={acao} style={{ minHeight: 48, borderWidth: 1, borderColor: cores.borda, padding: 12, borderRadius: 10, justifyContent: 'center' }}><Text style={{ color: cores.texto }}>{texto}</Text></Pressable>
    return <View style={{ padding: 14, gap: 10, backgroundColor: cores.superficie, borderRadius: 14 }}>
        {botao(`${aberto ? 'Fechar' : 'Abrir'} curadoria da galeria global`, () => { setAberto(!aberto); if (!aberto) void carregar() })}
        {aberto && <>
            <Text style={{ color: cores.textoSecundario }}>Upload global fica disponível imediatamente. Desativar remove das novas seleções, sem apagar referências existentes.</Text>
            {erro ? <Text accessibilityRole="alert" style={{ color: '#DC2626' }}>{erro}</Text> : null}
            {botao('Atualizar galeria', () => { void carregar() })}
            <Text style={{ color: cores.texto }}>Finalidade da nova imagem: {finalidade}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{(['SERVICO', 'CAPA', 'PROFISSIONAL', 'AVATAR'] as const).map((uso) => <View key={uso}>{botao(uso, () => setFinalidade(uso))}</View>)}</View>
            <SeletorImagem global finalidade={finalidade} titulo="Enviar nova imagem global" disabled={ocupado} alterar={(_, id) => { if (id) void carregar(id) }} />
            {form ? <View style={{ gap: 10 }}>
                <CampoTexto label="Título" maxLength={120} value={form.titulo} onChangeText={(titulo) => setForm({ ...form, titulo })} />
                <Text style={{ color: cores.texto }}>Finalidade fixa: {form.finalidade} · Segmento: {form.segmentoSlug ?? 'Neutro'}</Text>
                {botao('Todos / neutro', () => setForm({ ...form, segmentoSlug: null }))}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{dados?.segmentos.map((s) => <View key={s.slug}>{botao(s.nome, () => setForm({ ...form, segmentoSlug: s.slug }))}</View>)}</View>
                <Text style={{ color: cores.texto }}>Disponível para novas seleções</Text><Switch value={form.ativo} disabled={ocupado} onValueChange={(ativo) => setForm({ ...form, ativo })} />
                {botao('Salvar curadoria', salvar)}
            </View> : null}
            {dados?.itens.map((item) => <View key={item.id} style={{ gap: 6 }}><Image source={{ uri: urlMidia(item.versoes.miniatura.url), cache: 'force-cache' }} resizeMode="contain" style={{ width: '100%', height: 90 }} />{botao(`${item.titulo} · ${item.finalidade} · ${item.ativo ? 'Ativa' : 'Desativada'}`, () => setForm(item))}</View>)}
            {dados && !dados.itens.length ? <Text style={{ color: cores.texto }}>Galeria vazia. Envie uma imagem.</Text> : null}
            <Text style={{ color: cores.texto }}>Auditoria recente</Text>
            {dados?.auditoria.map((a) => <Text key={a.id} style={{ color: cores.textoSecundario }}>{new Date(a.createdAt).toLocaleString('pt-BR')} · {a.acao} · autor #{a.usuarioId}</Text>)}
        </>}
    </View>
}
