import { perfilAdmin, perfilOperacional, resolverPerfil } from '@/src/data/auth/perfis'
import useSessao from '@/src/data/hooks/useSessao'
import type { AbasParamList } from '@/src/navigation/types'
import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { ComponentProps } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Agendamento from './Agendamento'
import Inicio from './Inicio'
import { Administracao, Configuracoes, Operacao } from './ModuloEmPreparacao'
import AbaPerfilUsuario from './Usuario'

const Tab = createBottomTabNavigator<AbasParamList>()
type NomeIcone = ComponentProps<typeof Ionicons>['name']

function opcoesAba(label: string, icone: NomeIcone) {
    return {
        tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View style={styles.tabScreen}>
                <Ionicons name={icone} size={24} color={focused ? '#29A7EA' : '#9DA2AE'} />
                <Text style={[styles.tabScreenText, { color: focused ? '#29A7EA' : '#9DA2AE' }]}>
                    {label}
                </Text>
            </View>
        ),
    }
}

export default function Abas() {
    const { usuario } = useSessao()
    const perfil = resolverPerfil(usuario)
    const cliente = perfil === 'CUSTOMER'
    const operacional = perfilOperacional(perfil)
    const admin = perfilAdmin(perfil)

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveBackgroundColor: '#222',
                tabBarInactiveBackgroundColor: '#222',
                tabBarStyle: { backgroundColor: '#222' },
            }}
        >
            {cliente ? (
                <>
                    <Tab.Screen name="Inicio" component={Inicio} options={opcoesAba('Início', 'home-outline')} />
                    <Tab.Screen
                        name="Agendamento"
                        component={Agendamento}
                        options={opcoesAba('Agendar', 'calendar-outline')}
                    />
                </>
            ) : null}
            {operacional ? (
                <>
                    <Tab.Screen
                        name="Operacao"
                        component={Operacao}
                        options={opcoesAba('Operação', 'briefcase-outline')}
                    />
                    <Tab.Screen
                        name="Configuracoes"
                        component={Configuracoes}
                        options={opcoesAba('Ajustes', 'settings-outline')}
                    />
                </>
            ) : null}
            {admin ? (
                <Tab.Screen
                    name="Administracao"
                    component={Administracao}
                    options={opcoesAba('Admin', 'shield-checkmark-outline')}
                />
            ) : null}
            <Tab.Screen
                name="Usuario"
                component={AbaPerfilUsuario}
                options={opcoesAba('Perfil', 'person-outline')}
            />
        </Tab.Navigator>
    )
}

const styles = StyleSheet.create({
    tabScreen: { flexDirection: 'column', alignItems: 'center' },
    tabScreenText: { fontSize: 12 },
})
