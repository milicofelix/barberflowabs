import CampoEmail from '@/src/components/shared/CampoEmail'
import CampoSenha from '@/src/components/shared/CampoSenha'
import CampoTexto from '@/src/components/shared/CampoTexto'
import EstadoErro from '@/src/components/shared/EstadoErro'
import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import useFormAuth from '@/src/data/hooks/useFormAuth'
import type { StackParamList } from '@/src/navigation/types'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useRef } from 'react'
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Props = NativeStackScreenProps<StackParamList, 'Autenticacao'>

export default function Autenticacao(_: Props) {
    const {
        nome, email, telefone, senha, confirmacaoSenha, modo, erros, erroGeral, sucesso, processando,
        alterarNome, alterarEmail, alterarTelefone, alterarSenha, alterarConfirmacaoSenha, alterarModo, submeter,
    } = useFormAuth()
    const emailRef = useRef<TextInput>(null)
    const telefoneRef = useRef<TextInput>(null)
    const senhaRef = useRef<TextInput>(null)
    const confirmacaoRef = useRef<TextInput>(null)
    const cadastro = modo === 'cadastro'

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'right', 'bottom', 'left']}>
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.cabecalho}>
                        <Image
                            source={require('@/assets/images/brand/logo-mark-transparent.png')}
                            style={styles.logo}
                            resizeMode="contain"
                            accessibilityLabel="Logo Barber Flow ABS"
                        />
                        <Text style={styles.marca}>Barber Flow ABS</Text>
                        <Text style={styles.assinatura}>Sua rotina de cuidado, no seu tempo.</Text>
                    </View>

                    <View style={styles.cartao}>
                        <View style={styles.seletorModo}>
                            <Pressable
                                onPress={cadastro ? alterarModo : undefined}
                                style={[styles.opcaoModo, !cadastro && styles.opcaoModoAtiva]}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: !cadastro }}
                            >
                                <Text style={[styles.textoModo, !cadastro && styles.textoModoAtivo]}>Entrar</Text>
                            </Pressable>
                            <Pressable
                                onPress={!cadastro ? alterarModo : undefined}
                                style={[styles.opcaoModo, cadastro && styles.opcaoModoAtiva]}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: cadastro }}
                            >
                                <Text style={[styles.textoModo, cadastro && styles.textoModoAtivo]}>Criar conta</Text>
                            </Pressable>
                        </View>

                        <Text style={styles.titulo}>{cadastro ? 'Comece sua jornada' : 'Que bom ter você aqui'}</Text>
                        <Text style={styles.descricao}>
                            {cadastro
                                ? 'Crie sua conta para encontrar serviços e organizar seus agendamentos.'
                                : 'Entre para acessar seus horários e continuar cuidando do seu estilo.'}
                        </Text>

                        <View style={styles.formulario}>
                            {cadastro ? (
                                <CampoTexto
                                    label="Nome completo" placeholder="Como podemos chamar você?" value={nome}
                                    onChangeText={alterarNome} error={erros.nome} autoCapitalize="words"
                                    autoComplete="name" textContentType="name" returnKeyType="next"
                                    onSubmitEditing={() => emailRef.current?.focus()} submitBehavior="submit"
                                />
                            ) : null}
                            <CampoEmail
                                ref={emailRef} label="E-mail" placeholder="voce@exemplo.com" value={email}
                                onChangeText={alterarEmail} error={erros.email} returnKeyType="next"
                                onSubmitEditing={() => (cadastro ? telefoneRef : senhaRef).current?.focus()}
                                submitBehavior="submit"
                            />
                            {cadastro ? (
                                <CampoTexto
                                    ref={telefoneRef} label="Telefone" placeholder="(00) 00000-0000" value={telefone}
                                    onChangeText={alterarTelefone} error={erros.telefone} keyboardType="phone-pad"
                                    autoComplete="tel" textContentType="telephoneNumber" returnKeyType="next"
                                    onSubmitEditing={() => senhaRef.current?.focus()} submitBehavior="submit" maxLength={15}
                                />
                            ) : null}
                            <CampoSenha
                                ref={senhaRef} label="Senha" placeholder="Mínimo de 6 caracteres" value={senha}
                                onChangeText={alterarSenha} error={erros.senha}
                                autoComplete={cadastro ? 'new-password' : 'current-password'}
                                textContentType={cadastro ? 'newPassword' : 'password'}
                                returnKeyType={cadastro ? 'next' : 'done'}
                                onSubmitEditing={() => (cadastro ? confirmacaoRef.current?.focus() : submeter())}
                                submitBehavior={cadastro ? 'submit' : 'blurAndSubmit'}
                            />
                            {cadastro ? (
                                <CampoSenha
                                    ref={confirmacaoRef} label="Confirmar senha" placeholder="Digite a senha novamente"
                                    value={confirmacaoSenha} onChangeText={alterarConfirmacaoSenha}
                                    error={erros.confirmacaoSenha} autoComplete="new-password"
                                    textContentType="newPassword" returnKeyType="done" onSubmitEditing={submeter}
                                />
                            ) : null}
                        </View>

                        {!cadastro ? (
                            <Pressable disabled style={styles.linkFuturo} accessibilityState={{ disabled: true }}>
                                <Text style={styles.linkFuturoTexto}>Esqueci minha senha · em breve</Text>
                            </Pressable>
                        ) : (
                            <Text style={styles.legal}>
                                Ao criar sua conta, você concordará com os Termos de Uso e a Política de Privacidade
                                assim que estiverem disponíveis.
                            </Text>
                        )}

                        {erroGeral ? <EstadoErro mensagem={erroGeral} /> : null}
                        {sucesso ? <FeedbackSucesso mensagem={sucesso} /> : null}

                        <Pressable
                            style={({ pressed }) => [styles.botao, pressed && !processando ? styles.botaoPressionado : null,
                                processando ? styles.botaoDesabilitado : null]}
                            onPress={submeter} disabled={processando} accessibilityRole="button"
                            accessibilityState={{ busy: processando, disabled: processando }}
                        >
                            {processando ? (
                                <View style={styles.conteudoBotao}>
                                    <ActivityIndicator color="#081426" />
                                    <Text style={styles.botaoTexto}>{cadastro ? 'Criando conta...' : 'Entrando...'}</Text>
                                </View>
                            ) : (
                                <Text style={styles.botaoTexto}>{cadastro ? 'Criar minha conta' : 'Entrar'}</Text>
                            )}
                        </Pressable>

                        <Pressable onPress={alterarModo} style={styles.alternarModo} disabled={processando}>
                            <Text style={styles.alternarModoTexto}>
                                {cadastro ? 'Já possui uma conta? ' : 'Ainda não possui uma conta? '}
                                <Text style={styles.alternarModoDestaque}>{cadastro ? 'Entrar' : 'Criar conta'}</Text>
                            </Text>
                        </Pressable>
                    </View>
                    <Text style={styles.rodape}>Agendamentos simples. Experiências memoráveis.</Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' },
    container: { flex: 1 },
    scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 28 },
    cabecalho: { alignItems: 'center', marginBottom: 22 },
    logo: { width: 112, height: 112 },
    marca: { color: '#FFFFFF', fontSize: 29, fontWeight: '800', letterSpacing: 0.3, marginTop: 4 },
    assinatura: { color: '#BBC6D6', fontSize: 14, lineHeight: 20, marginTop: 5, textAlign: 'center' },
    cartao: { width: '100%', maxWidth: 460, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 22,
        shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.24,
        shadowRadius: 24, elevation: 10 },
    seletorModo: { flexDirection: 'row', borderRadius: 12, backgroundColor: '#EEF1F5', padding: 4, marginBottom: 24 },
    opcaoModo: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
    opcaoModoAtiva: { backgroundColor: '#FFFFFF' },
    textoModo: { color: '#667085', fontWeight: '700' },
    textoModoAtivo: { color: '#081426' },
    titulo: { color: '#081426', fontSize: 24, fontWeight: '800', textAlign: 'center' },
    descricao: { color: '#667085', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
    formulario: { width: '100%', marginTop: 24 },
    linkFuturo: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 16 },
    linkFuturoTexto: { color: '#7B8798', fontSize: 13 },
    legal: { color: '#667085', fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 16 },
    botao: { width: '100%', minHeight: 52, backgroundColor: '#E7B84B', borderRadius: 13,
        alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    botaoPressionado: { backgroundColor: '#D8A838', transform: [{ scale: 0.995 }] },
    botaoDesabilitado: { opacity: 0.7 },
    conteudoBotao: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    botaoTexto: { color: '#081426', fontSize: 16, fontWeight: '800' },
    alternarModo: { paddingTop: 20, paddingBottom: 2, paddingHorizontal: 8 },
    alternarModoTexto: { color: '#667085', fontSize: 14, textAlign: 'center' },
    alternarModoDestaque: { color: '#0A4B78', fontWeight: '800' },
    rodape: { color: '#91A0B5', fontSize: 12, textAlign: 'center', marginTop: 22 },
})
