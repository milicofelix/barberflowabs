import { ActivityIndicator, StyleSheet, Text, Pressable, View } from 'react-native'
import { DateUtils, MoedaUtils } from '@barbabrutal/core'
import useAgendamento from '../../data/hooks/useAgendamento'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { StackParamList } from '@/src/navigation/types'
import { useState } from 'react'
import EstadoErro from '@/src/components/shared/EstadoErro'
import { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useBarbearia from '@/src/data/hooks/useBarbearia'
import useTema from '@/src/data/contexts/ContextoTema'

type Props = NativeStackScreenProps<StackParamList, 'Sumario'>

export default function Sumario({ navigation }: Props) {
    const { cores } = useTema()
    const { data, profissional, servicos, duracaoTotal, precoTotal, agendar } = useAgendamento()
    const [processando, setProcessando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const { barbearia } = useBarbearia()
    const possuiAgendamentoAtivo = erro?.includes('agendamento ativo') ?? false

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
        <View style={[styles.container, { backgroundColor: cores.fundo }]}>
            <View style={[styles.card, { backgroundColor: cores.superficie, borderColor: cores.borda, borderWidth: 1 }]}>
                <Text style={[styles.titulo, { color: cores.texto }]}>Resumo do Agendamento</Text>
                <Text style={[styles.subtitulo, { color: cores.textoSecundario }]}>Será um prazer atendê-lo!</Text>

                <Text style={[styles.label, { color: cores.textoSecundario }]}>BARBEARIA</Text>
                <Text style={[styles.valor, { color: cores.texto }]}>{barbearia?.nome ?? 'Não selecionada'}</Text>

                <Text style={[styles.label, { color: cores.textoSecundario }]}>PROFISSIONAL</Text>
                <Text style={[styles.valor, { color: cores.texto }]}>{profissional?.nome}</Text>

                <Text style={[styles.label, { color: cores.textoSecundario }]}>SERVIÇOS</Text>
                {servicos.map((s, index) => (
                    <Text key={index} style={[styles.servico, { color: cores.texto }]}>
                        {index + 1}. {s.nome}
                    </Text>
                ))}

                <Text style={[styles.label, { color: cores.textoSecundario }]}>DURAÇÃO</Text>
                <Text style={[styles.valor, { color: cores.texto }]}>{duracaoTotal()}</Text>

                <Text style={[styles.label, { color: cores.textoSecundario }]}>HORÁRIO</Text>
                <Text style={[styles.valor, { color: cores.texto }]}>{data && DateUtils.formatarDataEHora(data)}</Text>

                <Text style={[styles.valorTotalLabel, { color: cores.textoSecundario }]}>VALOR TOTAL</Text>
                <Text style={[styles.valorTotal, { color: cores.texto }]}>{MoedaUtils.formatar(precoTotal())}</Text>

                {erro ? <EstadoErro mensagem={erro} /> : null}

                {possuiAgendamentoAtivo ? (
                    <Pressable
                        style={[styles.botaoSecundario, { borderColor: cores.destaque }]}
                        onPress={() => navigation.navigate('Abas', { screen: 'Inicio' })}
                    >
                        <Text style={[styles.textoBotaoSecundario, { color: cores.destaque }]}>Ver e cancelar meu agendamento</Text>
                    </Pressable>
                ) : null}

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
    botaoSecundario: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
        padding: 12,
    },
    textoBotaoSecundario: { fontSize: 14, fontWeight: '700' },
})
