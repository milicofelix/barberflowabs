import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Profissional } from '@barbabrutal/core'
import useProfissionais from '@/src/data/hooks/useProfissionais'
import imagens from '@/src/data/constants/imagens'
import Carregando from './Carregando'
import EstadoErro from './EstadoErro'
import EstadoVazio from './EstadoVazio'
import useTema from '@/src/data/contexts/ContextoTema'

interface CampoProfissionalProps {
    value: Profissional | null
    onChange: (profissional: Profissional) => void
}

export default function CampoProfissional(props: CampoProfissionalProps) {
    const { cores } = useTema()
    const { value, onChange } = props
    const { profissionais, carregando, erro, carregarProfissionais } = useProfissionais()

    if (carregando) return <Carregando mensagem="Buscando profissionais..." />
    if (erro) return <EstadoErro mensagem={erro} tentarNovamente={carregarProfissionais} />
    if (profissionais.length === 0) {
        return <EstadoVazio titulo="Nenhum profissional disponível" />
    }

    function renderizarProfissional(p: Profissional) {
        return (
            <View
                key={p?.id}
                style={{
                    ...styles.profissionalContainer,
                    backgroundColor: value?.id === p?.id ? cores.sucesso : cores.superficie,
                    borderColor: cores.borda,
                }}
            >
                <Pressable onPress={() => onChange(p)}>
                    <View style={{ alignItems: 'center' }}>
                        <Image
                            style={{ width: 100, height: 100, borderRadius: 6 }}
                            source={imagens.profissionais.find((pr) => pr.id === p.id)?.imagem}
                        />
                        <Text style={{ color: value?.id === p?.id ? '#FFFFFF' : cores.texto, paddingVertical: 5 }}>
                            {p.nome.split(' ')[0]}
                        </Text>
                    </View>
                </Pressable>
            </View>
        )
    }

    return (
        <View style={styles.container}>{profissionais.map((p) => renderizarProfissional(p))}</View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 40,
        gap: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    profissionalContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        padding: 2,
    },
})
