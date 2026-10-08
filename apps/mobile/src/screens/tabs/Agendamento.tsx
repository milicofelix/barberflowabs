import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import FormularioAgendamento from '@/src/components/agendamento/FormularioAgendamento'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { AbasParamList, StackParamList } from '@/src/navigation/types'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import useBarbearia from '@/src/data/hooks/useBarbearia'
import Carregando from '@/src/components/shared/Carregando'
import EstadoVazio from '@/src/components/shared/EstadoVazio'

type Props = BottomTabScreenProps<AbasParamList, 'Agendamento'>

export default function Agendamento({ navigation }: Props) {
    const { barbearia, carregando } = useBarbearia()

    if (carregando) return <Carregando mensagem="Carregando sua barbearia..." />

    if (!barbearia) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.vazio}>
                    <EstadoVazio
                        titulo="Escolha uma barbearia"
                        descricao="Consulte os perfis e selecione onde deseja realizar o agendamento."
                        acaoLabel="Encontrar barbearias"
                        onAcao={() => navigation.navigate('Descobrir')}
                    />
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.tenant}>
                    <Text style={styles.tenantLabel}>AGENDANDO EM</Text>
                    <Text style={styles.tenantNome}>{barbearia.nome}</Text>
                    <Text style={styles.tenantCidade}>{barbearia.cidade || 'Localização em atualização'}</Text>
                    <Text style={styles.trocar} onPress={() => navigation.navigate('Descobrir')}>Trocar barbearia</Text>
                </View>
                <FormularioAgendamento
                    finalizar={() =>
                        navigation.getParent<NativeStackNavigationProp<StackParamList>>()?.navigate('Sumario')
                    }
                />
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#081426',
    },
    scroll: {
        padding: 18,
        paddingBottom: 36,
    },
    vazio: { flex: 1, justifyContent: 'center' },
    tenant: { backgroundColor: '#101E33', borderWidth: 1, borderColor: '#26364E', borderRadius: 14, padding: 15, marginBottom: 22 },
    tenantLabel: { color: '#E7B84B', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
    tenantNome: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 5 },
    tenantCidade: { color: '#AEBBCE', fontSize: 12, marginTop: 3 },
    trocar: { color: '#E7B84B', fontSize: 13, fontWeight: '800', marginTop: 10 },
})
