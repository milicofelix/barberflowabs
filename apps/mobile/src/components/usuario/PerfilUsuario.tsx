import { StyleSheet, View, Image, Text, Pressable } from 'react-native'
import { Usuario } from '@barbabrutal/core'
import React from 'react'

export interface PerfilUsuarioProps {
    usuario: Usuario
    logout: () => void
}

export default function PerfilUsuario(props: PerfilUsuarioProps) {
    return (
        <View style={styles.container}>
            <Image source={require('@/assets/images/avatar.png')} style={styles.avatar} />
            <Text style={styles.destaque}>Fala, {props.usuario?.nome}!</Text>
            <Text style={styles.texto}>E-mail: {props.usuario?.email.toLowerCase()}</Text>
            <Pressable style={styles.botao} onPress={props.logout}>
                <Text style={styles.textoBotao}>SAIR</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 48,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: '45%',
        height: '45%',
        borderRadius: 9999,
        marginRight: 12,
    },
    destaque: {
        fontSize: 28,
        fontWeight: '600',
        color: '#fff',
        margin: 5,
    },
    texto: {
        marginTop: 2,
        fontSize: 18,
        fontWeight: '400',
        color: '#A9A9A9',
    },
    botao: {
        margin: 30,
        width: '35%',
        height: 45,
        backgroundColor: '#EF4444',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 5,
    },
    textoBotao: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
})
