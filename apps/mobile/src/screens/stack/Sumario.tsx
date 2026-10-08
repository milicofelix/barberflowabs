import { ActivityIndicator, StyleSheet, Text, Pressable, View } from 'react-native'
import { DateUtils, MoedaUtils } from '@barbabrutal/core'
import useAgendamento from '../../data/hooks/useAgendamento'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { StackParamList } from '@/src/navigation/types'
import { useState } from 'react'
import EstadoErro from '@/src/components/shared/EstadoErro'
import { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useBarbearia from '@/src/data/hooks/useBarbearia'

type Props = NativeStackScreenProps<StackParamList, 'Sumario'>

export default function Sumario({ navigation }: Props) {
    const { data, profissional, servicos, duracaoTotal, precoTotal, agendar } = useAgendamento()
    const [processando, setProcessando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const { barbearia } = useBarbearia()

    async function finalizar() {
        if (processando) return

        try {
            setProcessando(true)
            setErro(null)
            await agendar()
            navigation.navigate('Abas', { screen: 'Inicio' })
        } catch (erro) {
            setErro(mensagemDoErro(erro))
        } finally {
            setProcessando(false)
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.titulo}>Resumo do Agendamento</Text>
                <Text style={styles.subtitulo}>Será um prazer atendê-lo!</Text>

                <Text style={styles.label}>BARBEARIA</Text>
                <Text style={styles.valor}>{barbearia?.nome ?? 'Não selecionada'}</Text>

                <Text style={styles.label}>PROFISSIONAL</Text>
                <Text style={styles.valor}>{profissional?.nome}</Text>

                <Text style={styles.label}>SERVIÇOS</Text>
                {servicos.map((s, index) => (
                    <Text key={index} style={styles.servico}>
                        {index + 1}. {s.nome}
                    </Text>
                ))}

                <Text style={styles.label}>DURAÇÃO</Text>
                <Text style={styles.valor}>{duracaoTotal()}</Text>

                <Text style={styles.label}>HORÁRIO</Text>
                <Text style={styles.valor}>{data && DateUtils.formatarDataEHora(data)}</Text>

                <Text style={styles.valorTotalLabel}>VALOR TOTAL</Text>
                <Text style={styles.valorTotal}>{MoedaUtils.formatar(precoTotal())}</Text>

                {erro ? <EstadoErro mensagem={erro} /> : null}

                <Pressable
                    style={[styles.botao, processando && styles.botaoDesabilitado]}
                    onPress={finalizar}
                    disabled={processando}
                >
                    {processando ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.textoBotao}>Finalizar Agendamento</Text>
                    )}
                </Pressable>
            </View>
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        gap: 5,
        backgroundColor: '#1E1E1E',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        alignItems: 'center',
    },
    titulo: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subtitulo: {
        color: '#FFFFFF',
        fontSize: 14,
        marginBottom: 20,
    },
    label: {
        color: '#AAAAAA',
        fontSize: 12,
        alignSelf: 'flex-start',
        marginTop: 10,
    },
    valor: {
        color: '#FFFFFF',
        fontSize: 16,
        alignSelf: 'flex-start',
    },
    servico: {
        color: '#FFFFFF',
        fontSize: 16,
        alignSelf: 'flex-start',
        marginTop: 5,
    },
    valorTotalLabel: {
        color: '#AAAAAA',
        fontSize: 12,
        alignSelf: 'flex-start',
        marginTop: 20,
    },
    valorTotal: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
    },
    botao: {
        backgroundColor: '#16a34a',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 5,
        marginTop: 30,
    },
    textoBotao: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    botaoDesabilitado: { opacity: 0.65 },
})
