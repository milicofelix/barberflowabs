import { Image, StyleSheet, Text, Pressable, View } from 'react-native'
import { Servico } from '@barbabrutal/core'
import useServicos from '@/src/data/hooks/useServicos'
import imagens from '@/src/data/constants/imagens'

interface ServicosInputProps {
    value: Servico[]
    onChange: (servicos: Servico[]) => void
}

function Opcao(props: { servico: Servico; onClick: (s: Servico) => void; selecionado?: boolean }) {
    return (
        <View
            key={props.servico.id}
            style={{
                ...styles.servicoCard,
                backgroundColor: props.selecionado ? '#22c55e' : '#18181b',
            }}
        >
            <Pressable
                onPress={() => {
                    props.onClick(props.servico)
                }}
            >
                <View>
                    <Image
                        style={styles.imagemServico}
                        source={imagens.servicos.find((s) => s.id === props.servico.id)?.imagem}
                    />
                    <Text style={styles.textoServico}>{props.servico.nome}</Text>
                </View>
            </Pressable>
        </View>
    )
}

export default function ServicosInput(props: ServicosInputProps) {
    const { value, onChange } = props
    const { servicos: todosOsServicos } = useServicos()

    function alternarMarcacaoServico(servico: Servico) {
        const encontrado = value.find((s) => s.id === servico.id)
        onChange(encontrado ? value.filter((s) => s.id !== servico.id) : [...value, servico])
    }

    return (
        <View style={styles.container}>
            {todosOsServicos.map((servico) => (
                <Opcao
                    key={servico.id}
                    onClick={alternarMarcacaoServico}
                    servico={servico}
                    selecionado={value.some((s) => servico.id === s.id)}
                />
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 40,
        gap: 6,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    servicoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#18181b',
        borderRadius: 8,
        padding: 2,
    },
    servicoCard: {
        borderRadius: 8,
        padding: 2,
    },
    textoServico: {
        color: 'white',
        paddingVertical: 5,
        textAlign: 'center',
    },
    imagemServico: {
        width: 122,
        height: 122,
        borderRadius: 6,
    },
})
