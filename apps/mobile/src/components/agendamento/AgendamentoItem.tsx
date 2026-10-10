import { Agendamento, DateUtils, MoedaUtils } from '@barbabrutal/core'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

interface AgendamentoItemProps {
    agendamento: Agendamento
    onCancelar?: (agendamento: Agendamento) => void
}

export default function AgendamentoItem(props: AgendamentoItemProps) {
    const { cores } = useTema()
    const status = props.agendamento.status ?? 'AGENDADO'
    const fim = new Date(props.agendamento.dataFim ?? props.agendamento.data)
    const aguardandoEncerramento = ['AGENDADO', 'CONFIRMADO', 'CHECKIN'].includes(status)
        && fim.getTime() <= Date.now()
    const statusLabel = aguardandoEncerramento
        ? 'Aguardando atualização do estabelecimento'
        : ({
            AGENDADO: 'Agendado', CONFIRMADO: 'Confirmado', CHECKIN: 'Check-in',
            CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado', NO_SHOW: 'Não compareceu',
        } as Record<string, string>)[status] ?? status
    const statusCritico = status === 'CANCELADO' || status === 'NO_SHOW'
    const corStatus = statusCritico ? cores.perigo : status === 'CONCLUIDO' ? cores.sucesso : cores.destaque
    function precoTotal() {
        return props.agendamento.servicos.reduce((acc, servico) => acc + servico.preco!, 0)
    }

    function renderizarServicos() {
        return props.agendamento.servicos
            .map((servico, index) => {
                return `${index + 1}. ${servico.nome}`
            })
            .join(', ')
    }

    return (
        <View style={[styles.container, { backgroundColor: cores.superficie, borderColor: cores.destaque }]}>
            <View style={[styles.status, { borderColor: corStatus }]}>
                <Text style={[styles.statusTexto, { color: corStatus }]}>{statusLabel}</Text>
            </View>
            <Text style={[styles.profissional, { color: cores.texto }]}>{props.agendamento.profissional.nome}</Text>
            {props.agendamento.barbearia?.nome ? (
                <Text style={[styles.estabelecimento, { color: cores.textoSecundario }]}>
                    {props.agendamento.barbearia.nome}
                </Text>
            ) : null}
            {props.agendamento.unidade?.nome ? (
                <Text style={[styles.estabelecimento, { color: cores.textoSecundario }]}>Unidade: {props.agendamento.unidade.nome}</Text>
            ) : null}
            <Text style={[styles.data, { color: cores.destaque }]}>
                {props.agendamento.data &&
                    DateUtils.formatarDataEHora(new Date(props.agendamento.data))}
            </Text>
            <Text style={[styles.servicos, { color: cores.textoSecundario }]}>{renderizarServicos()}</Text>
            <Text style={[styles.preco, { color: cores.texto }]}>{MoedaUtils.formatar(precoTotal())}</Text>
            {props.onCancelar ? (
                <Pressable
                    accessibilityRole="button"
                    style={[styles.cancelar, { borderColor: cores.perigo }]}
                    onPress={() => props.onCancelar?.(props.agendamento)}
                >
                    <Text style={[styles.cancelarTexto, { color: cores.perigo }]}>Cancelar agendamento</Text>
                </Pressable>
            ) : null}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1a1a1a',
        borderColor: '#007AFF',
        padding: 16,
        paddingLeft: 35,
        borderRadius: 8,
        margin: 8,
        borderWidth: 0.5,
        borderRightWidth: 10,
        minWidth: '90%',
    },
    profissional: {
        fontSize: 14,
        color: '#ffffff',
        marginBottom: 4,
    },
    estabelecimento: { fontSize: 12, marginBottom: 4 },
    status: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, marginBottom: 8 },
    statusTexto: { fontSize: 11, fontWeight: '800' },
    data: {
        color: '#007AFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    servicos: {
        fontSize: 12,
        color: '#ffffff',
        marginBottom: 8,
    },
    preco: {
        fontSize: 14,
        color: '#ffffff',
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    cancelar: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderRadius: 6,
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    cancelarTexto: { fontSize: 13, fontWeight: '700' },
})
