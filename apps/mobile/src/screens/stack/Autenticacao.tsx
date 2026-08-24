import CampoEmail from '@/src/components/shared/CampoEmail'
import CampoSenha from '@/src/components/shared/CampoSenha'
import CampoTexto from '@/src/components/shared/CampoTexto'
import useFormAuth from '@/src/data/hooks/useFormAuth'
import useSessao from '@/src/data/hooks/useSessao'
import { useEffect } from 'react'
import { View, Text, StyleSheet, ImageBackground, Image, Pressable } from 'react-native'

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
            >
                <View style={styles.conteudo}>
                    <Image
                        source={require('@/assets/images/inicio/logo-brutal.png')}
                        style={styles.logo}
                    />
                    <Text style={styles.titulo}>🤘 DO CLASSICO AO ROCK 🤘</Text>
                    <Text style={styles.descricao}>
                        Cabelo afiado, barba de lenhador e mãos de motoqueiro, tudo ao som de rock
                        pesado!
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
                    <Pressable onPress={() => alterarModo()} style={{ paddingTop: 25 }}>
                        <Text style={styles.buttonText}>
                            {modo === 'login'
                                ? 'Não possui conta? Faça seu cadastro!'
                                : 'Já possui conta? Clique aqui para fazer login!'}
                        </Text>
                    </Pressable>
                </View>
            </ImageBackground>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imagemDeFundo: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
    },
    formulario: {
        padding: 20,
    },
    logo: {
        marginVertical: 20,
    },
    conteudo: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    titulo: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    descricao: {
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
        marginBottom: 20,
        marginHorizontal: 20,
    },
    button: {
        width: '40%',
        height: 40,
        backgroundColor: '#22c55e',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
})
