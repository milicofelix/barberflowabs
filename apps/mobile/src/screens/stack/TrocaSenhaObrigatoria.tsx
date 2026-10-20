import { useState } from 'react'
import { Pressable, ScrollView, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import CampoSenha from '@/src/components/shared/CampoSenha'
import useSessao from '@/src/data/hooks/useSessao'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'

export default function TrocaSenhaObrigatoria() {
    const { iniciarSessao, encerrarSessao } = useSessao(); const { httpPost } = useAPI(); const { cores } = useTema()
    const [atual, setAtual] = useState(''); const [nova, setNova] = useState(''); const [confirmacao, setConfirmacao] = useState('')
    const [erro, setErro] = useState(''); const [salvando, setSalvando] = useState(false)
    const valido = atual.length >= 6 && nova.length >= 6 && nova !== atual && confirmacao === nova
    async function salvar() {
        if (!valido || salvando) return
        setSalvando(true); setErro('')
        try {
            const token = await httpPost<string>('/auth/alterar-senha', { senhaAtual: atual, novaSenha: nova }, { escopoTenant: 'nenhum' })
            await iniciarSessao(token)
        } catch (e) { setErro(mensagemDoErro(e)) }
        finally { setSalvando(false) }
    }
    return <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 12, flexGrow: 1, justifyContent: 'center' }}>
            <Text style={{ color: cores.texto, fontSize: 25, fontWeight: '800' }}>Crie sua senha de acesso</Text>
            <Text style={{ color: cores.textoSecundario }}>Substitua a senha temporária fornecida pelo estabelecimento para continuar.</Text>
            <CampoSenha label="Senha temporária" value={atual} onChangeText={setAtual} editable={!salvando} />
            <CampoSenha label="Nova senha (mínimo 6 caracteres)" value={nova} onChangeText={setNova} maxLength={72} editable={!salvando} />
            <CampoSenha label="Confirme a nova senha" value={confirmacao} onChangeText={setConfirmacao} maxLength={72} editable={!salvando} />
            {nova && nova === atual ? <Text style={{ color: cores.textoSecundario }}>Escolha uma senha diferente da temporária.</Text> : null}
            {confirmacao && confirmacao !== nova ? <Text style={{ color: cores.textoSecundario }}>As senhas não coincidem.</Text> : null}
            {erro ? <Text accessibilityRole="alert" style={{ color: '#B42318' }}>{erro}</Text> : null}
            <Pressable accessibilityRole="button" disabled={!valido || salvando} onPress={salvar} style={{ minHeight: 48, padding: 14, borderRadius: 10, backgroundColor: cores.destaque, opacity: !valido || salvando ? 0.5 : 1 }}>
                <Text style={{ color: cores.destaqueTexto, fontWeight: '800', textAlign: 'center' }}>{salvando ? 'Salvando...' : 'Salvar senha e continuar'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={salvando} onPress={() => { void encerrarSessao() }} style={{ padding: 14 }}><Text style={{ color: cores.texto, textAlign: 'center' }}>Sair</Text></Pressable>
        </ScrollView>
    </SafeAreaView>
}
