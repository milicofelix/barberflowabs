import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import FormularioAgendamento from '@/src/components/agendamento/FormularioAgendamento'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { AbasParamList, StackParamList } from '@/src/navigation/types'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

type Props = BottomTabScreenProps<AbasParamList, 'Agendamento'>

export default function Agendamento({ navigation }: Props) {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
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
        backgroundColor: 'black',
    },
    scroll: {
        paddingVertical: 20,
    },
})
