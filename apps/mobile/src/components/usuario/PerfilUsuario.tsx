import { StyleSheet, View, Text, Pressable } from 'react-native'
import { Usuario } from '@uniflowabs/core'
import React from 'react'
import { resolverPerfil } from '@/src/data/auth/perfis'
import useTema from '@/src/data/contexts/ContextoTema'
import useSessao from '@/src/data/hooks/useSessao'
import ImagemRegistro from '@/src/components/midia/ImagemRegistro'
import AvatarUsuario from '@/src/components/midia/AvatarUsuario'

export interface PerfilUsuarioProps {
    usuario: Usuario
    logout: () => void
    cadastrarEstabelecimento: () => void
}

export default function PerfilUsuario(props: PerfilUsuarioProps) {
    const { renovarSessao } = useSessao()
    const { cores } = useTema()
    const perfil = resolverPerfil(props.usuario)
    const nomePerfil = {
        CUSTOMER: 'Cliente',
        ESTABLISHMENT_MEMBER: 'Profissional',
        ESTABLISHMENT_OWNER: 'Responsável pelo estabelecimento',
        SUPER_ADMIN: 'Administrador do software',
        APP_OWNER: 'Dono do software',
    }[perfil ?? 'CUSTOMER']

    return (
        <View style={styles.container}>
            <AvatarUsuario nome={props.usuario.nome} fotoURL={props.usuario.fotoURL} />
            <Text style={[styles.destaque, { color: cores.texto }]}>Fala, {props.usuario?.nome}!</Text>
            <Text style={[styles.texto, { color: cores.textoSecundario }]}>E-mail: {props.usuario?.email.toLowerCase()}</Text>
            <Text style={styles.perfil}>{nomePerfil}</Text>
            <View style={{ width: '100%', marginVertical: 20 }}><ImagemRegistro titulo="Minha foto" valor={props.usuario.fotoURL} entidade="USUARIO" finalidade="AVATAR" aoSalvar={renovarSessao} /></View>
            {perfil === 'CUSTOMER' ? <Pressable style={[styles.botaoEstabelecimento, { borderColor: cores.destaque }]} onPress={props.cadastrarEstabelecimento}>
                <Text style={[styles.textoEstabelecimento, { color: cores.destaque }]}>Cadastrar meu estabelecimento</Text>
            </Pressable> : null}
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
        width: 96,
        height: 96,
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
    perfil: {
        marginTop: 10,
        color: '#facc15',
        fontSize: 14,
        fontWeight: '700',
    },
    botaoEstabelecimento: { minHeight: 46, marginTop: 24, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    textoEstabelecimento: { fontSize: 14, fontWeight: '800' },
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
