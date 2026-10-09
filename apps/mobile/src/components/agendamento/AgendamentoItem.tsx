import { Agendamento, DateUtils, MoedaUtils } from '@barbabrutal/core'
import { StyleSheet, Text, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

interface AgendamentoItemProps {
    agendamento: Agendamento
}

export default function AgendamentoItem(props: AgendamentoItemProps) {
    const { cores } = useTema()
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
            <Text style={[styles.profissional, { color: cores.texto }]}>{props.agendamento.profissional.nome}</Text>
            <Text style={[styles.data, { color: cores.destaque }]}>
                {props.agendamento.data &&
                    DateUtils.formatarDataEHora(new Date(props.agendamento.data))}
            </Text>
            <Text style={[styles.servicos, { color: cores.textoSecundario }]}>{renderizarServicos()}</Text>
            <Text style={[styles.preco, { color: cores.texto }]}>{MoedaUtils.formatar(precoTotal())}</Text>
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
})
