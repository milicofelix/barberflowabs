import { Agendamento } from '@barbabrutal/core'
import { StyleSheet, Text, View, Image } from 'react-native'
import AgendamentoItem from './AgendamentoItem'
import React, { useCallback, useEffect, useState } from 'react'
import useAPI from '../../data/hooks/useAPI'
import useSessao from '@/src/data/hooks/useSessao'
import Carregando from '../shared/Carregando'
import EstadoErro from '../shared/EstadoErro'
import EstadoVazio from '../shared/EstadoVazio'
import { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useBarbearia from '@/src/data/hooks/useBarbearia'
import useTema from '@/src/data/contexts/ContextoTema'

export default function AgendamentosUsuario() {
    const { cores } = useTema()
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const { httpGet } = useAPI()
    const { usuario } = useSessao()
    const { barbearia, carregando: carregandoBarbearia } = useBarbearia()

    const carregarAgendamentos = useCallback(async () => {
        if (!usuario?.email || !barbearia) {
            setAgendamentos([])
            setCarregando(false)
            return
        }
        try {
            setCarregando(true)
            setErro(null)
            const dados = await httpGet<Agendamento[]>('/agendamentos', { escopoTenant: 'publico' })
            setAgendamentos(Array.isArray(dados) ? dados : [])
        } catch (erro) {
            setErro(mensagemDoErro(erro))
        } finally {
            setCarregando(false)
        }
    }, [barbearia, httpGet, usuario?.email])

    useEffect(() => {
        if (!carregandoBarbearia) carregarAgendamentos()
    }, [carregandoBarbearia, carregarAgendamentos])

    function renderizarConteudo() {
        if (carregando || carregandoBarbearia) return <Carregando mensagem="Buscando seus agendamentos..." />
        if (erro) return <EstadoErro mensagem={erro} tentarNovamente={carregarAgendamentos} />

        if (!barbearia) {
            return <EstadoVazio titulo="Escolha uma barbearia"
                descricao="Use a aba Descobrir para selecionar onde deseja agendar." />
        }

        if (agendamentos.length > 0) {
            return (
                <View>
                    <Text style={[styles.subtitulo, { color: cores.texto }]}>Aqui estão seus últimos agendamentos:</Text>
                    {[...agendamentos]
                        .reverse()
                        .map((a: Agendamento) => <AgendamentoItem agendamento={a} key={a.id} />)}
                </View>
            )
        } else {
            return (
                <View style={styles.vazio}>
                    <EstadoVazio
                        titulo="Você ainda não tem agendamentos"
                        descricao="Escolha a aba Agendar para marcar seu próximo horário."
                    />
                    <Image
                        source={require('@/assets/images/inicio/garoto-propaganda.png')}
                        style={styles.garotoPropaganda}
                    />
                </View>
            )
        }
    }

    return (
        <View style={styles.container}>
            <Image
                source={require('@/assets/images/brand/logo-mark-transparent.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="Logo UniFlow ABS"
            />
            <Text style={[styles.titulo, { color: cores.texto }]}>Fala, {usuario?.nome}!</Text>
            {renderizarConteudo()}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    titulo: {
        fontSize: 30,
        color: '#e4e4e7',
        fontWeight: '800',
    },
    subtitulo: {
        fontSize: 16,
        textAlign: 'center',
        color: '#e4e4e7',
    },
    agendamentoItemContainer: {
        backgroundColor: '#09090b',
        borderRadius: 10,
        height: 144,
    },
    agendamentoItemConteudo: {
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 20,
    },
    agendamentoItemTexto: {
        fontSize: 16,
        color: 'white',
    },
    agendamentoTitulo: {
        fontSize: 40,
        color: 'white',
    },
    agendamentoHora: {
        fontSize: 25,
        color: 'white',
    },
    logo: {
        width: 220,
        height: 166,
        marginTop: 20,
    },
    garotoPropaganda: {
        marginBottom: 20,
        marginTop: 20,
    },
    vazio: { justifyContent: 'center', alignItems: 'center' },
})
