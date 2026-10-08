import Carregando from '@/src/components/shared/Carregando'
import { ProvedorAgendamento } from '@/src/data/contexts/ContextoAgendamento'
import { ProvedorSessao } from '@/src/data/contexts/ContextoSessao'
import { ProvedorBarbearia } from '@/src/data/contexts/ContextoBarbearia'
import { resolverPerfil } from '@/src/data/auth/perfis'
import useSessao from '@/src/data/hooks/useSessao'
import type { StackParamList } from '@/src/navigation/types'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Abas from '../tabs'
import Autenticacao from './Autenticacao'
import Sumario from './Sumario'
import PerfilBarbearia from './PerfilBarbearia'

const Stack = createNativeStackNavigator<StackParamList>()

function Navegacao() {
    const { carregando, usuario } = useSessao()
    const cliente = resolverPerfil(usuario) === 'CUSTOMER'

    if (carregando) return <Carregando mensagem="Validando sua sessão..." />

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {!usuario ? (
                    <Stack.Screen
                        name="Autenticacao"
                        component={Autenticacao}
                        options={{ headerShown: false }}
                    />
                ) : (
                    <>
                        <Stack.Screen name="Abas" component={Abas} options={{ headerShown: false }} />
                        {cliente ? (
                            <Stack.Screen
                                name="PerfilBarbearia"
                                component={PerfilBarbearia}
                                options={{
                                    title: 'Perfil da barbearia',
                                    headerBackTitle: 'Descobrir',
                                    headerStyle: { backgroundColor: '#081426' },
                                    headerTintColor: '#FFFFFF',
                                }}
                            />
                        ) : null}
                        {cliente ? (
                            <Stack.Screen
                                name="Sumario"
                                component={Sumario}
                                options={{
                                    title: 'Confirmar Agendamento',
                                    headerBackTitle: 'Voltar',
                                    headerStyle: { backgroundColor: '#333' },
                                    headerTintColor: '#FFF',
                                }}
                            />
                        ) : null}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default function App() {
    return (
        <SafeAreaProvider>
            <StatusBar style="light" backgroundColor="#081426" />
            <ProvedorSessao>
                <ProvedorBarbearia>
                    <ProvedorAgendamento>
                        <Navegacao />
                    </ProvedorAgendamento>
                </ProvedorBarbearia>
            </ProvedorSessao>
        </SafeAreaProvider>
    )
}
