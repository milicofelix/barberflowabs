import { Image, StyleSheet, Text, Pressable, View } from 'react-native'
import { Servico } from '@uniflowabs/core'
import useServicos from '@/src/data/hooks/useServicos'
import { imagemDoServico } from '@/src/data/constants/imagens'
import Carregando from './Carregando'
import EstadoErro from './EstadoErro'
import EstadoVazio from './EstadoVazio'
import useTema from '@/src/data/contexts/ContextoTema'

interface ServicosInputProps {
    value: Servico[]
    onChange: (servicos: Servico[]) => void
}

function Opcao(props: { servico: Servico; onClick: (s: Servico) => void; selecionado?: boolean }) {
    const { cores } = useTema()
    return (
        <View
            key={props.servico.id}
            style={{
                ...styles.servicoCard,
                backgroundColor: props.selecionado ? cores.sucesso : cores.superficie,
                borderColor: cores.borda,
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
                        source={imagemDoServico(props.servico.nome, props.servico.imagemURL)}
                        resizeMode="contain"
                    />
                    <Text style={[styles.textoServico, { color: props.selecionado ? '#FFFFFF' : cores.texto }]}>{props.servico.nome}</Text>
                </View>
            </Pressable>
        </View>
    )
}

export default function ServicosInput(props: ServicosInputProps) {
    const { value, onChange } = props
    const {
        servicos: todosOsServicos,
        carregando,
        erro,
        carregarServicos,
    } = useServicos()

    if (carregando) return <Carregando mensagem="Buscando serviços..." />
    if (erro) return <EstadoErro mensagem={erro} tentarNovamente={carregarServicos} />
    if (todosOsServicos.length === 0) return <EstadoVazio titulo="Nenhum serviço disponível" />

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
        borderWidth: 1,
        padding: 2,
    },
    textoServico: {
        color: 'white',
        paddingVertical: 5,
        textAlign: 'center',
    },
    imagemServico: {
        width: 122,
        aspectRatio: 16 / 9,
        borderRadius: 6,
    },
})
