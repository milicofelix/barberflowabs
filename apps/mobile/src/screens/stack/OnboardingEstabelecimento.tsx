import CampoEmail from '@/src/components/shared/CampoEmail'
import CampoSenha from '@/src/components/shared/CampoSenha'
import CampoTexto from '@/src/components/shared/CampoTexto'
import EstadoErro from '@/src/components/shared/EstadoErro'
import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import useOnboardingEstabelecimento from '@/src/data/hooks/useOnboardingEstabelecimento'
import type { StackParamList } from '@/src/navigation/types'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'
import MarcaUniFlow from '@/src/components/shared/MarcaUniFlow'

type Props = NativeStackScreenProps<StackParamList, 'OnboardingEstabelecimento'>
const TIPOS = [['BARBEARIA', 'Barbearia'], ['SALAO_BELEZA', 'Salão'], ['CLINICA_ESTETICA', 'Clínica'], ['SPA_BEM_ESTAR', 'Spa'], ['ESTUDIO_BELEZA', 'Estúdio'], ['PROFISSIONAL_AUTONOMO', 'Autônomo']]
const MODELOS = [['PRESENCIAL', 'Presencial'], ['DOMICILIAR', 'Domiciliar'], ['HIBRIDO', 'Híbrido']]

export default function OnboardingEstabelecimento({ navigation }: Props) {
    const { cores } = useTema()
    const dados = useOnboardingEstabelecimento(); const f = dados.form
    if (dados.concluido) return <SafeAreaView style={[styles.sucesso, { backgroundColor: cores.fundo }]}><FeedbackSucesso mensagem="Cadastro enviado para revisão. Você poderá entrar após a aprovação." />
        <Botao texto="Voltar para o login" acao={() => navigation.goBack()} /></SafeAreaView>
    return <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['bottom']}><ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <View style={styles.marca}><MarcaUniFlow compacta /></View>
        <Text style={styles.sobretitulo}>NOVO ESTABELECIMENTO</Text><Text style={[styles.titulo, { color: cores.texto }]}>Comece na UniFlow ABS</Text>
        <Bloco titulo="Negócio"><CampoTexto label="Nome do estabelecimento" value={f.nome} onChangeText={(v) => dados.alterar('nome', v)} />
            <CampoTexto label="Slug" value={f.slug} onChangeText={(v) => dados.alterar('slug', v)} autoCapitalize="none" />
            <CampoEmail label="E-mail comercial" value={f.emailEstabelecimento} onChangeText={(v) => dados.alterar('emailEstabelecimento', v)} />
            <CampoTexto label="Telefone comercial" value={f.telefoneEstabelecimento} onChangeText={(v) => dados.alterar('telefoneEstabelecimento', v)} keyboardType="phone-pad" />
            <Text style={[styles.label, { color: cores.textoSecundario }]}>Tipo</Text><Opcoes itens={TIPOS} selecionados={[f.tipoEstabelecimento]} alternar={(id) => dados.alterar('tipoEstabelecimento', id)} />
            <Text style={[styles.label, { color: cores.textoSecundario }]}>Modelo de atendimento</Text><Opcoes itens={MODELOS} selecionados={[f.modeloAtendimento]} alternar={(id) => dados.alterar('modeloAtendimento', id)} /></Bloco>
        <Bloco titulo="Segmentos e especialidades"><Opcoes itens={dados.segmentos.map((s) => [String(s.id), s.nome])} selecionados={f.segmentoIds.map(String)} alternar={(id) => dados.alternar('segmentoIds', Number(id))} />
            <Text style={[styles.label, { color: cores.textoSecundario }]}>Especialidades</Text><Opcoes itens={dados.especialidades.map((e) => [String(e.id), e.nome])} selecionados={f.especialidadeIds.map(String)} alternar={(id) => dados.alternar('especialidadeIds', Number(id))} /></Bloco>
        <Bloco titulo="Responsável"><CampoTexto label="Nome completo" value={f.nomeResponsavel} onChangeText={(v) => dados.alterar('nomeResponsavel', v)} />
            <CampoEmail label="E-mail de acesso" value={f.emailResponsavel} onChangeText={(v) => dados.alterar('emailResponsavel', v)} />
            <CampoTexto label="Telefone" value={f.telefoneResponsavel} onChangeText={(v) => dados.alterar('telefoneResponsavel', v)} keyboardType="phone-pad" />
            <CampoSenha label="Senha" value={f.senha} onChangeText={(v) => dados.alterar('senha', v)} /></Bloco>
        <Bloco titulo="Plano"><Opcoes itens={dados.planos.map((p) => [p.slug, `${p.nome} · ${moeda(p.valorDoCiclo ?? p.precoMensal)}`])} selecionados={[f.planoSlug]} alternar={(id) => dados.alterar('planoSlug', id)} /></Bloco>
        {dados.erro ? <EstadoErro mensagem={dados.erro} /> : null}<Botao texto={dados.processando ? 'Enviando...' : 'Enviar cadastro'} acao={dados.submeter} />
    </ScrollView></SafeAreaView>
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) { const { cores } = useTema(); return <View style={[styles.bloco, { backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1 }]}><Text style={[styles.blocoTitulo, { color: cores.texto }]}>{titulo}</Text>{children}</View> }
function Opcoes({ itens, selecionados, alternar }: { itens: string[][]; selecionados: string[]; alternar: (id: string) => void }) { const { cores } = useTema(); return <View style={styles.opcoes}>{itens.map(([id, nome]) => <Pressable key={id} onPress={() => alternar(id)} style={[styles.chip, { borderColor: cores.borda }, selecionados.includes(id) && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}><Text style={[styles.chipTexto, { color: selecionados.includes(id) ? cores.destaqueTexto : cores.texto }]}>{nome}</Text></Pressable>)}</View> }
function Botao({ texto, acao }: { texto: string; acao: () => void }) { return <Pressable style={styles.botao} onPress={acao}><Text style={styles.botaoTexto}>{texto}</Text></Pressable> }
const moeda = (v?: number) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' }, conteudo: { padding: 18, paddingBottom: 40, gap: 14 }, marca: { alignItems: 'center', marginBottom: 4 }, sucesso: { flex: 1, backgroundColor: '#081426', justifyContent: 'center', padding: 22, gap: 18 },
    sobretitulo: { color: '#E7B84B', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, titulo: { color: '#FFF', fontSize: 29, fontWeight: '900' }, bloco: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 8 }, blocoTitulo: { color: '#081426', fontSize: 19, fontWeight: '900', marginBottom: 5 }, label: { color: '#475467', fontWeight: '700', marginTop: 5 },
    opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { borderWidth: 1, borderColor: '#B8C0CC', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 }, chipAtivo: { backgroundColor: '#E7B84B', borderColor: '#E7B84B' }, chipTexto: { color: '#344054', fontSize: 12, fontWeight: '700' }, chipTextoAtivo: { color: '#081426' },
    botao: { minHeight: 52, borderRadius: 13, backgroundColor: '#E7B84B', alignItems: 'center', justifyContent: 'center' }, botaoTexto: { color: '#081426', fontWeight: '900', fontSize: 15 },
})
