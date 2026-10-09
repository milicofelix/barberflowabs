import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'

const MOTIVOS = ['Dados incorretos', 'Localização incorreta', 'Conteúdo inadequado', 'Barbearia não existe', 'Outro motivo']

interface Props {
    slug: string
    nomeBarbearia: string
    aberto: boolean
    fechar: () => void
}

export default function DenunciaPerfil({ slug, nomeBarbearia, aberto, fechar }: Props) {
    const { cores } = useTema()
    const { httpPost } = useAPI()
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [motivo, setMotivo] = useState(MOTIVOS[0])
    const [mensagem, setMensagem] = useState('')
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)
    const [enviando, setEnviando] = useState(false)

    async function enviar() {
        if (enviando) return
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setErro('Informe um e-mail válido ou deixe o campo vazio.')
            return
        }
        if (mensagem.trim().length < 10) {
            setErro('Descreva o problema usando pelo menos 10 caracteres.')
            return
        }
        try {
            setEnviando(true)
            setErro(null)
            const resposta = await httpPost<{ mensagem?: string }>(`/public/estabelecimentos/${slug}/denuncias`, {
                nome: nome.trim(), email: email.trim(), motivo, mensagem: mensagem.trim(),
            }, { escopoTenant: 'nenhum' })
            setSucesso(resposta?.mensagem ?? 'Denúncia recebida para revisão.')
            setNome('')
            setEmail('')
            setMensagem('')
            setMotivo(MOTIVOS[0])
        } catch (e) {
            setErro(mensagemDoErro(e))
        } finally {
            setEnviando(false)
        }
    }

    function encerrar() {
        setErro(null)
        setSucesso(null)
        fechar()
    }

    return (
        <Modal visible={aberto} animationType="slide" presentationStyle="pageSheet" onRequestClose={encerrar}>
            <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]}>
                <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
                    <View style={styles.cabecalho}>
                        <View style={styles.cabecalhoTexto}>
                            <Text style={styles.sobretitulo}>CANAL DE CONFIANÇA</Text>
                            <Text style={[styles.titulo, { color: cores.texto }]}>Reportar perfil</Text>
                        </View>
                        <Pressable onPress={encerrar} hitSlop={12}><Text style={styles.fechar}>Fechar</Text></Pressable>
                    </View>
                    <Text style={[styles.descricao, { color: cores.textoSecundario }]}>Avise sobre informações incorretas ou conteúdo inadequado em {nomeBarbearia}.</Text>
                    <Campo label="Nome (opcional)" value={nome} onChangeText={setNome} autoCapitalize="words" />
                    <Campo label="E-mail (opcional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    <Text style={[styles.label, { color: cores.texto }]}>Motivo</Text>
                    <View style={styles.motivos}>
                        {MOTIVOS.map((item) => (
                            <Pressable key={item} onPress={() => setMotivo(item)} style={[styles.motivo, { borderColor: cores.borda }, motivo === item && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}>
                                <Text style={[styles.motivoTexto, { color: motivo === item ? cores.destaqueTexto : cores.texto }]}>{item}</Text>
                            </Pressable>
                        ))}
                    </View>
                    <Text style={[styles.label, { color: cores.texto }]}>Mensagem</Text>
                    <TextInput value={mensagem} onChangeText={(valor) => { setMensagem(valor); setErro(null) }}
                        multiline numberOfLines={5} maxLength={1000} textAlignVertical="top"
                        placeholder="Conte o que precisa ser revisado..." placeholderTextColor={cores.textoSecundario} style={[styles.input, styles.textarea, { backgroundColor: cores.campo, color: cores.campoTexto, borderColor: cores.borda, borderWidth: 1 }]} />
                    <Text style={styles.contador}>{mensagem.length}/1000</Text>
                    {erro ? <Text style={styles.erro}>{erro}</Text> : null}
                    {sucesso ? <FeedbackSucesso mensagem={sucesso} /> : null}
                    <Pressable onPress={enviar} disabled={enviando || !!sucesso} style={[styles.enviar, (enviando || !!sucesso) && styles.desabilitado]}>
                        {enviando ? <ActivityIndicator color="#081426" /> : <Text style={styles.enviarTexto}>Enviar para revisão</Text>}
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    )
}

function Campo(props: { label: string; value: string; onChangeText: (valor: string) => void; keyboardType?: 'email-address'; autoCapitalize?: 'none' | 'words' }) {
    const { cores } = useTema()
    const { label, ...inputProps } = props
    return <View><Text style={[styles.label, { color: cores.texto }]}>{label}</Text><TextInput {...inputProps}
        placeholderTextColor={cores.textoSecundario} style={[styles.input, { backgroundColor: cores.campo, color: cores.campoTexto, borderColor: cores.borda, borderWidth: 1 }]} /></View>
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' },
    conteudo: { padding: 20, paddingBottom: 40 },
    cabecalho: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
    cabecalhoTexto: { flex: 1 },
    sobretitulo: { color: '#E7B84B', fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
    titulo: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 5 },
    fechar: { color: '#E7B84B', fontWeight: '800', paddingTop: 6 },
    descricao: { color: '#AEBBCE', lineHeight: 21, marginTop: 10, marginBottom: 22 },
    label: { color: '#E7EAF0', fontSize: 13, fontWeight: '700', marginBottom: 7, marginTop: 14 },
    input: { minHeight: 50, borderRadius: 11, backgroundColor: '#FFFFFF', color: '#101828', paddingHorizontal: 14, fontSize: 15 },
    textarea: { minHeight: 120, paddingTop: 13 },
    motivos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    motivo: { borderWidth: 1, borderColor: '#43516A', paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999 },
    motivoAtivo: { backgroundColor: '#E7B84B', borderColor: '#E7B84B' },
    motivoTexto: { color: '#CDD5E1', fontSize: 12, fontWeight: '700' },
    motivoTextoAtivo: { color: '#081426' },
    contador: { color: '#78869A', fontSize: 11, textAlign: 'right', marginTop: 5 },
    erro: { color: '#FCA5A5', backgroundColor: '#451A1A', padding: 12, borderRadius: 9, marginTop: 14 },
    enviar: { minHeight: 52, backgroundColor: '#E7B84B', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
    enviarTexto: { color: '#081426', fontSize: 15, fontWeight: '900' },
    desabilitado: { opacity: 0.6 },
})
