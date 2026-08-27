import CampoEmail from '@/src/components/shared/CampoEmail'
import CampoSenha from '@/src/components/shared/CampoSenha'
import CampoTexto from '@/src/components/shared/CampoTexto'
import useFormAuth from '@/src/data/hooks/useFormAuth'
import useSessao from '@/src/data/hooks/useSessao'
import { useEffect } from 'react'
import { View, Text, StyleSheet, ImageBackground, Pressable, Platform } from 'react-native'

export default function Autenticacao({ navigation }: any) {
    const { usuario } = useSessao()
    const {
        nome,
        email,
        senha,
        modo,
        erros,
        alterarNome,
        alterarEmail,
        alterarSenha,
        alterarModo,
        submeter,
    } = useFormAuth()

    useEffect(() => {
        if (usuario) {
            navigation?.replace('Abas')
        }
    }, [usuario])

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('@/assets/images/inicio/fundo.png')}
                style={styles.imagemDeFundo}
                imageStyle={styles.imagem}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <View style={styles.conteudo}>
                        <Text style={styles.marca}>Barber Flow ABS</Text>
                        <Text style={styles.titulo}>AGENDE COM FACILIDADE</Text>
                        <Text style={styles.descricao}>
                            Encontre barbearias, escolha serviços e acompanhe seus horários em um só lugar.
                        </Text>
                        <View style={styles.formulario}>
                            {modo === 'cadastro' && (
                                <CampoTexto
                                    label="Nome"
                                    placeholder="Digite seu nome"
                                    value={nome}
                                    onChangeText={alterarNome}
                                    error={erros.nome}
                                />
                            )}
                            <CampoEmail
                                label="E-mail"
                                placeholder="Digite seu e-mail"
                                value={email.toLowerCase()}
                                onChangeText={alterarEmail}
                                error={erros.email}
                            />
                            <CampoSenha
                                label="Senha"
                                placeholder="Informe sua senha"
                                value={senha}
                                onChangeText={alterarSenha}
                                error={erros.senha}
                            />
                        </View>
                        <Pressable style={styles.button} onPress={submeter}>
                            <Text style={styles.buttonText}>Entrar</Text>
                        </Pressable>
                        <Pressable onPress={() => alterarModo()} style={styles.alternarModo}>
                            <Text style={styles.linkText}>
                                {modo === 'login'
                                    ? 'Não possui conta? Faça seu cadastro!'
                                    : 'Já possui conta? Clique aqui para fazer login!'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </ImageBackground>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#09090b',
        ...(Platform.OS === 'web' ? ({ minHeight: '100vh', width: '100vw' } as any) : {}),
    },
    imagemDeFundo: {
        flex: 1,
        width: '100%',
        ...(Platform.OS === 'web' ? ({ minHeight: '100vh' } as any) : {}),
    },
    imagem: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 48,
    },
    formulario: {
        width: '100%',
        marginTop: 28,
        marginBottom: 8,
    },
    conteudo: {
        width: '100%',
        maxWidth: 440,
        alignItems: 'center',
        justifyContent: 'center',
    },
    marca: {
        color: '#fff',
        fontSize: 34,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 18,
    },
    titulo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#facc15',
        marginBottom: 10,
        textAlign: 'center',
    },
    descricao: {
        fontSize: 14,
        color: '#f4f4f5',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    button: {
        width: '100%',
        height: 48,
        backgroundColor: '#22c55e',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    alternarModo: {
        paddingTop: 25,
        paddingHorizontal: 12,
    },
    linkText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
})
