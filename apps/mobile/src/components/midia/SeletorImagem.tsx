import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { ImagePickerOptions } from 'expo-image-picker'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import { imagemDoProfissional, imagemDoServico } from '@/src/data/constants/imagens'
import type { FinalidadeMidia, ImagemGaleria } from '@uniflowabs/core'
import { resolverURLMidia } from '@uniflowabs/core'

export const urlMidia = (url: string) => url.startsWith('/midias/') ? resolverURLMidia(url, process.env.API_URL ?? '') : url.startsWith('/') ? `${process.env.API_URL?.replace(/\/$/, '')}${url}` : url

export default function SeletorImagem({ valor, finalidade, alterar, titulo = 'Imagem', padrao = '', disabled = false }: {
    valor?: string | null; finalidade: FinalidadeMidia; alterar: (url: string, id: string | null) => void
    titulo?: string; padrao?: string; disabled?: boolean
}) {
    const { cores } = useTema(); const { httpGet, httpUpload } = useAPI()
    const [aberto, setAberto] = useState(false); const [galeria, setGaleria] = useState<ImagemGaleria[]>([])
    const [erro, setErro] = useState(''); const [carregando, setCarregando] = useState(false)
    const [foto, setFoto] = useState<string | null>(null); const [enviando, setEnviando] = useState(false)
    const [progresso, setProgresso] = useState(0); const [segmento, setSegmento] = useState<string | null>(null)
    const [negado, setNegado] = useState(false); const [tentativa, setTentativa] = useState(0)
    const [falhou, setFalhou] = useState(false); const ocupado = useRef(false)
    useEffect(() => { setFalhou(false) }, [valor])
    useEffect(() => {
        if (!aberto) return
        let vigente = true; setCarregando(true); setGaleria([]); setErro('')
        httpGet<ImagemGaleria[]>(`/midias/galeria?finalidade=${finalidade}`).then((itens) => { if (vigente) setGaleria(itens) })
            .catch((e) => { if (vigente) setErro(mensagemDoErro(e)) }).finally(() => { if (vigente) setCarregando(false) })
        return () => { vigente = false }
    }, [aberto, finalidade, httpGet, tentativa])
    async function escolher(camera: boolean) {
        if (ocupado.current) return
        ocupado.current = true; setEnviando(true); setErro(''); setNegado(false)
        try {
            const Picker = await import('expo-image-picker')
            const { ImageManipulator, SaveFormat } = await import('expo-image-manipulator')
            // A biblioteca usa o seletor de fotos do sistema, inclusive acesso limitado.
            if (camera) {
                const permissao = await Picker.requestCameraPermissionsAsync()
                if (!permissao.granted) { setNegado(true); setErro('Câmera não autorizada. Você pode usar a galeria.'); return }
            }
            const opcoes: ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: finalidade !== 'SERVICO', aspect: finalidade === 'CAPA' ? [16, 9] : [1, 1], quality: 1 }
            const resultado = camera ? await Picker.launchCameraAsync(opcoes) : await Picker.launchImageLibraryAsync(opcoes)
            if (resultado.canceled || !resultado.assets[0]) return
            const asset = resultado.assets[0]
            const contexto = ImageManipulator.manipulate(asset.uri)
            const proporcao = finalidade === 'CAPA' ? 16 / 9 : 1
            const largura = Math.floor(Math.min(asset.width, asset.height * proporcao))
            const altura = Math.floor(largura / proporcao)
            if (finalidade === 'SERVICO') {
                const escala = Math.min(1, 800 / Math.max(asset.width, asset.height))
                contexto.resize({ width: Math.max(1, Math.round(asset.width * escala)), height: Math.max(1, Math.round(asset.height * escala)) })
            } else {
                contexto.crop({ originX: Math.floor((asset.width - largura) / 2), originY: Math.floor((asset.height - altura) / 2), width: largura, height: altura })
                contexto.resize({ width: Math.min(largura, finalidade === 'CAPA' ? 1600 : 800) })
            }
            const imagem = await contexto.renderAsync()
            const convertida = await imagem.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 })
            setFoto(convertida.uri)
        } catch (e) {
            const mensagem = mensagemDoErro(e)
            setErro(/native module|native part|cannot find module/i.test(mensagem) ? 'Este recurso precisa de uma versão atualizada do aplicativo. Gere e instale um novo development build.' : mensagem)
        }
        finally { ocupado.current = false; setEnviando(false) }
    }
    async function enviar() {
        if (!foto || ocupado.current) return
        ocupado.current = true; setEnviando(true); setErro(''); setProgresso(0)
        try { const midia = await httpUpload(foto, finalidade, setProgresso); alterar(midia.versoes.principal.url, midia.id); setAberto(false); setFoto(null) }
        catch (e) { setErro(mensagemDoErro(e)) }
        finally { ocupado.current = false; setEnviando(false) }
    }
    const fechar = () => { if (!ocupado.current) { setAberto(false); setFoto(null) } }
    const botao = (texto: string, acao: () => void) => <Pressable accessibilityRole="button" disabled={disabled || enviando} onPress={acao} style={[styles.botao, { borderColor: cores.borda, backgroundColor: cores.campo }, (disabled || enviando) && { opacity: 0.5 }]}><Text style={{ color: cores.texto, fontWeight: '700' }}>{texto}</Text></Pressable>
    const nomes: Record<string, string> = { barbearia: 'Barbearia', 'salao-beleza': 'Salão', 'manicure-pedicure': 'Unhas', 'clinica-estetica': 'Estética', 'spa-bem-estar': 'Spa', beleza: 'Beleza' }
    return <View style={styles.bloco}><Text style={{ color: cores.texto, fontWeight: '700' }}>{titulo}</Text>
        {valor && !falhou ? <Image source={finalidade === 'PROFISSIONAL' ? imagemDoProfissional(valor) : finalidade === 'SERVICO' ? imagemDoServico('', valor) : { uri: urlMidia(valor) }} resizeMode={finalidade === 'SERVICO' ? 'contain' : 'cover'} onError={() => setFalhou(true)} accessibilityLabel={titulo} style={[styles.previa, { aspectRatio: finalidade === 'CAPA' || finalidade === 'SERVICO' ? 16 / 9 : 1 }]} /> : <Text style={{ color: cores.textoSecundario }}>Imagem padrão</Text>}
        {botao('Escolher imagem ou enviar foto', () => { setFoto(null); setSegmento(null); setNegado(false); setAberto(true) })}
        {botao('Usar padrão', () => alterar(padrao, null))}
        <Modal visible={aberto} animationType="slide" presentationStyle="fullScreen" onRequestClose={fechar}>
            <SafeAreaView style={[styles.safe, { backgroundColor: cores.fundo }]}><ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
                <Text style={[styles.titulo, { color: cores.texto }]}>{titulo}</Text>{botao('Fechar', fechar)}
                {erro ? <Text accessibilityRole="alert" style={{ color: '#DC2626' }}>{erro}</Text> : null}
                {negado ? botao('Abrir permissões do aparelho', () => { void Linking.openSettings() }) : null}
                {foto ? <><Image source={{ uri: foto }} resizeMode={finalidade === 'SERVICO' ? 'contain' : 'cover'} style={[styles.previa, { aspectRatio: finalidade === 'CAPA' || finalidade === 'SERVICO' ? 16 / 9 : 1 }]} />
                    <Text accessibilityRole="text" style={{ color: cores.texto }}>{enviando ? progresso === 100 ? 'Processando foto...' : `Enviando ${progresso}%` : 'Confira a foto antes de enviar.'}</Text>
                    {botao('Usar esta foto', enviar)}{botao('Escolher outra foto', () => setFoto(null))}</>
                    : <>{botao('Escolher do aparelho', () => escolher(false))}{botao('Tirar foto', () => escolher(true))}
                        <View style={styles.chips}>{botao('Todos', () => setSegmento(null))}{Array.from(new Set(galeria.map((item) => item.segmentoSlug).filter((s): s is string => !!s))).map((s) => <View key={s}>{botao(nomes[s] ?? s, () => setSegmento(s))}</View>)}</View>
                        {carregando ? <ActivityIndicator color={cores.destaque} /> : null}
                        {erro ? botao('Recarregar galeria', () => setTentativa((t) => t + 1)) : null}
                        <View style={styles.grade}>{galeria.filter((item) => !segmento || !item.segmentoSlug || item.segmentoSlug === segmento).map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.titulo} disabled={enviando} onPress={() => { alterar(item.versoes.principal.url, item.id); fechar() }} style={[styles.item, { borderColor: cores.borda }]}><Image source={{ uri: urlMidia(item.versoes.miniatura.url) }} resizeMode="contain" style={styles.miniatura} /><Text style={{ color: cores.texto }}>{item.titulo}</Text></Pressable>)}</View>
                        {!carregando && !erro && !galeria.length ? <Text style={{ color: cores.textoSecundario }}>Galeria vazia. Você pode enviar sua foto.</Text> : null}
                    </>}
            </ScrollView></SafeAreaView>
        </Modal>
    </View>
}
const styles = StyleSheet.create({ safe: { flex: 1 }, bloco: { gap: 8, marginBottom: 16 }, conteudo: { padding: 18, gap: 12 }, titulo: { fontSize: 23, fontWeight: '800' }, botao: { minHeight: 48, padding: 12, borderWidth: 1, borderRadius: 10, justifyContent: 'center' }, previa: { width: '100%', maxWidth: 360, borderRadius: 12 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, item: { width: '47%', padding: 8, borderWidth: 1, borderRadius: 10, gap: 6 }, miniatura: { width: '100%', aspectRatio: 1, borderRadius: 8 } })
