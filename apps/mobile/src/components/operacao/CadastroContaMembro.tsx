import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import CampoTexto from '@/src/components/shared/CampoTexto'
import CampoSenha from '@/src/components/shared/CampoSenha'
import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import useTema from '@/src/data/contexts/ContextoTema'
import type { NovaContaMembro, PermissaoEquipe, ProfissionalOperacional } from '@/src/data/operacao/tipos'
import { mensagemDoErro } from '@/src/data/hooks/useAPI'

export default function CadastroContaMembro({ profissional, papel, permissoes, criar, erro, aoConcluir, ocupar }: {
    profissional?: ProfissionalOperacional; papel: string; permissoes: PermissaoEquipe[]
    criar: (dados: NovaContaMembro) => Promise<boolean>; erro?: string | null
    aoConcluir: () => void; ocupar: (ocupado: boolean) => void
}) {
    const { cores } = useTema()
    const [nome, setNome] = useState(''); const [email, setEmail] = useState(''); const [senha, setSenha] = useState('')
    const [salvando, setSalvando] = useState(false); const [sucesso, setSucesso] = useState(false)
    const [falha, setFalha] = useState<string | null>(null)
    const valido = !!(profissional || nome.trim()) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && senha.length >= 6
    async function submeter() {
        if (!valido || salvando) return
        setSalvando(true); ocupar(true); setFalha(null); setSucesso(false)
        try {
            const criado = await criar({ nome: profissional?.nome ?? nome.trim(), email: email.trim().toLowerCase(), senhaTemporaria: senha, profissionalId: profissional?.id ?? null, papel, permissoes })
            if (!criado) { setFalha('Não foi possível cadastrar a conta.'); return }
            setNome(''); setEmail(''); setSenha(''); setSucesso(true); aoConcluir()
        } catch (e) { setFalha(mensagemDoErro(e)) }
        finally { setSalvando(false); ocupar(false) }
    }
    return <View style={{ gap: 8 }}>
        <Text style={{ color: cores.texto, fontWeight: '700' }}>Nova conta de acesso{profissional ? ` · ${profissional.nome}` : ''}</Text>
        {!profissional ? <CampoTexto label="Nome do membro" value={nome} onChangeText={setNome} editable={!salvando} /> : null}
        <CampoTexto label="E-mail de acesso" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!salvando} />
        <CampoSenha label="Senha temporária (mínimo 6 caracteres)" value={senha} onChangeText={setSenha} editable={!salvando} maxLength={72} />
        <Text style={{ color: cores.textoSecundario }}>Informe estes dados à pessoa. No primeiro acesso ela precisará substituir a senha temporária para usar o aplicativo.</Text>
        <Pressable accessibilityRole="button" disabled={!valido || salvando} onPress={submeter}
            style={{ minHeight: 48, borderRadius: 10, padding: 12, backgroundColor: cores.destaque, alignItems: 'center', justifyContent: 'center', opacity: !valido || salvando ? 0.5 : 1 }}>
            <Text style={{ color: cores.destaqueTexto, fontWeight: '800' }}>{salvando ? 'Criando conta e membro...' : 'Adicionar membro'}</Text>
        </Pressable>
        {sucesso ? <FeedbackSucesso mensagem="Conta e membro cadastrados. A troca de senha será solicitada no primeiro acesso." /> : null}
        {falha ? <Text accessibilityRole="alert" style={{ color: '#B42318' }}>{erro ?? falha}</Text> : null}
    </View>
}
