import Carregando from '@/src/components/shared/Carregando'
import { ProvedorAgendamento } from '@/src/data/contexts/ContextoAgendamento'
import { ProvedorSessao } from '@/src/data/contexts/ContextoSessao'
import { ProvedorEstabelecimento } from '@/src/data/contexts/ContextoEstabelecimento'
import useSessao from '@/src/data/hooks/useSessao'
import type { StackParamList } from '@/src/navigation/types'
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Abas from '../tabs'
import Autenticacao from './Autenticacao'
import Sumario from './Sumario'
import PerfilEstabelecimento from './PerfilEstabelecimento'
import OnboardingEstabelecimento from './OnboardingEstabelecimento'
import CentralFinanceira from './CentralFinanceira'
import AlternadorTema from '@/src/components/shared/AlternadorTema'
import { ProvedorTema } from '@/src/data/contexts/ContextoTema'
import useTema from '@/src/data/contexts/ContextoTema'
import SinoNotificacoesGlobal from '@/src/components/notificacoes/SinoNotificacoesGlobal'
import TrocaSenhaObrigatoria from './TrocaSenhaObrigatoria'
import { perfilAdmin, resolverPerfil } from '@/src/data/auth/perfis'

const Stack = createNativeStackNavigator<StackParamList>()

function Navegacao() {
    const { carregando, usuario } = useSessao()
    const { modo, cores } = useTema()
    const admin = perfilAdmin(resolverPerfil(usuario))

    if (carregando) return <Carregando mensagem="Validando sua sessão..." />
    if (usuario?.trocarSenhaObrigatoria) return <TrocaSenhaObrigatoria />

    return (
        <NavigationContainer theme={{ ...(modo === 'dark' ? DarkTheme : DefaultTheme), colors: { primary: cores.destaque, background: cores.fundo, card: cores.superficie, text: cores.texto, border: cores.borda, notification: cores.perigo } }}>
            <Stack.Navigator>
                <Stack.Screen name="Abas" component={Abas} options={{ headerShown: false }} />
                {!admin ? <Stack.Group navigationKey="cliente">
                    <Stack.Screen
                        name="PerfilEstabelecimento"
                        component={PerfilEstabelecimento}
                        options={{
                            title: 'Perfil do estabelecimento',
                            headerBackTitle: 'Descobrir',
                            headerStyle: { backgroundColor: cores.superficie },
                            headerTintColor: cores.texto,
                        }}
                    />
                    <Stack.Screen name="OnboardingEstabelecimento" component={OnboardingEstabelecimento}
                        options={{ title: 'Cadastrar estabelecimento', headerStyle: { backgroundColor: cores.superficie }, headerTintColor: cores.texto }} />
                    {usuario ? (
                        <Stack.Screen
                            name="Sumario"
                            component={Sumario}
                            options={{
                                title: 'Confirmar Agendamento',
                                headerBackTitle: 'Voltar',
                                headerStyle: { backgroundColor: cores.superficie },
                                headerTintColor: cores.texto,
                            }}
                        />
                    ) : null}
                </Stack.Group> : null}
                <Stack.Screen name="Autenticacao" component={Autenticacao} options={{ headerShown: false }} />
                {usuario ? (
                    <>
                        <Stack.Screen
                            name="CentralFinanceira"
                            component={CentralFinanceira}
                            options={{
                                title: 'Financeiro',
                                headerBackTitle: 'Operação',
                                headerStyle: { backgroundColor: cores.superficie },
                                headerTintColor: cores.texto,
                            }}
                        />
                    </>
                ) : null}
            </Stack.Navigator>
            <SinoNotificacoesGlobal />
            <AlternadorTema />
        </NavigationContainer>
    )
}

export default function App() {
    return (
        <SafeAreaProvider>
            <ProvedorTema>
                <StatusBar style="auto" />
                <ProvedorSessao>
                    <ProvedorEstabelecimento>
                        <ProvedorAgendamento>
                            <Navegacao />
                        </ProvedorAgendamento>
                    </ProvedorEstabelecimento>
                </ProvedorSessao>
            </ProvedorTema>
        </SafeAreaProvider>
    )
}
