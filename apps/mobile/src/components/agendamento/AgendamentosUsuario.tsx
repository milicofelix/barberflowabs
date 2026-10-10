import { Agendamento } from '@uniflowabs/core'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import AgendamentoItem from './AgendamentoItem'
import React, { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import useAPI from '../../data/hooks/useAPI'
import useSessao from '@/src/data/hooks/useSessao'
import Carregando from '../shared/Carregando'
import EstadoErro from '../shared/EstadoErro'
import EstadoVazio from '../shared/EstadoVazio'
import { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import Confirmacao from '../shared/Confirmacao'
import MarcaUniFlow from '../shared/MarcaUniFlow'

type FiltroAgendamento = 'ATIVOS' | 'HISTORICO'
const STATUS_ATIVOS = ['AGENDADO', 'CONFIRMADO', 'CHECKIN']

function agendamentoAtivo(agendamento: Agendamento) {
    const fim = new Date(agendamento.dataFim ?? agendamento.data)
    return STATUS_ATIVOS.includes(agendamento.status ?? 'AGENDADO') && fim.getTime() > Date.now()
}

export default function AgendamentosUsuario() {
    const { cores } = useTema()
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)
    const [agendamentoParaCancelar, setAgendamentoParaCancelar] = useState<Agendamento | null>(null)
    const [filtro, setFiltro] = useState<FiltroAgendamento>('ATIVOS')
    const { httpDelete, httpGet } = useAPI()
    const { usuario } = useSessao()

    const carregarAgendamentos = useCallback(async () => {
        if (!usuario?.email) {
            setAgendamentos([])
            setCarregando(false)
            return
        }
        try {
            setCarregando(true)
            setErro(null)
            const dados = await httpGet<Agendamento[]>('/agendamentos/meus', { escopoTenant: 'nenhum' })
            setAgendamentos(Array.isArray(dados) ? dados : [])
        } catch (erro) {
            setErro(mensagemDoErro(erro))
        } finally {
            setCarregando(false)
        }
    }, [httpGet, usuario?.email])

    useFocusEffect(useCallback(() => {
        carregarAgendamentos()
    }, [carregarAgendamentos]))

    async function cancelarAgendamento() {
        if (!agendamentoParaCancelar) return
        const id = agendamentoParaCancelar.id
        setAgendamentoParaCancelar(null)
        try {
            setErro(null)
            await httpDelete(`/agendamentos/meus/${id}`, undefined, { escopoTenant: 'nenhum' })
            await carregarAgendamentos()
        } catch (erro) {
            setErro(mensagemDoErro(erro))
        }
    }

    function renderizarConteudo() {
        if (carregando) return <Carregando mensagem="Buscando seus agendamentos..." />
        if (erro) return <EstadoErro mensagem={erro} tentarNovamente={carregarAgendamentos} />

        const filtrados = agendamentos.filter((agendamento) => (
            filtro === 'ATIVOS' ? agendamentoAtivo(agendamento) : !agendamentoAtivo(agendamento)
        ))

        return (
            <View style={styles.listaContainer}>
                <View style={styles.filtros}>
                    {(['ATIVOS', 'HISTORICO'] as const).map((opcao) => (
                        <Pressable
                            key={opcao}
                            onPress={() => setFiltro(opcao)}
                            style={[
                                styles.filtro,
                                { borderColor: cores.borda },
                                filtro === opcao && { backgroundColor: cores.destaque, borderColor: cores.destaque },
                            ]}
                        >
                            <Text style={{ color: filtro === opcao ? cores.destaqueTexto : cores.texto }}>
                                {opcao === 'ATIVOS' ? 'Ativos' : 'Histórico'}
                            </Text>
                        </Pressable>
                    ))}
                </View>
                {filtrados.length > 0 ? (
                    <View>
                        <Text style={[styles.subtitulo, { color: cores.texto }]}>
                            {filtro === 'ATIVOS' ? 'Seus próximos agendamentos:' : 'Agendamentos anteriores e cancelados:'}
                        </Text>
                        {filtrados.map((agendamento) => (
                            <AgendamentoItem
                                agendamento={agendamento}
                                key={agendamento.id}
                                onCancelar={agendamentoAtivo(agendamento) ? setAgendamentoParaCancelar : undefined}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.vazio}>
                        <EstadoVazio
                            titulo={filtro === 'ATIVOS' ? 'Você não tem agendamentos ativos' : 'Nenhum agendamento no histórico'}
                            descricao={filtro === 'ATIVOS' ? 'Escolha a aba Agendar para marcar seu próximo horário.' : 'Agendamentos concluídos, cancelados ou não realizados aparecerão aqui.'}
                        />
                        {filtro === 'ATIVOS' ? (
                            <Image
                                source={require('@/assets/images/inicio/garoto-propaganda.png')}
                                style={styles.garotoPropaganda}
                            />
                        ) : null}
                    </View>
                )}
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <MarcaUniFlow compacta exibirSlogan={false} />
            <Text style={[styles.titulo, { color: cores.texto }]}>Fala, {usuario?.nome}!</Text>
            {renderizarConteudo()}
            <Confirmacao
                visivel={!!agendamentoParaCancelar}
                titulo="Cancelar agendamento"
                mensagem="Deseja cancelar este agendamento? Essa ação libera o horário para outro cliente."
                confirmarLabel="Sim, cancelar"
                onConfirmar={cancelarAgendamento}
                onCancelar={() => setAgendamentoParaCancelar(null)}
            />
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
    listaContainer: { width: '100%' },
    filtros: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 },
    filtro: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
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
    garotoPropaganda: {
        marginBottom: 20,
        marginTop: 20,
    },
    vazio: { justifyContent: 'center', alignItems: 'center' },
})
