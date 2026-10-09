import { perfilAdmin, perfilOperacional, resolverPerfil } from '@/src/data/auth/perfis'
import useSessao from '@/src/data/hooks/useSessao'
import type { AbasParamList } from '@/src/navigation/types'
import { Ionicons } from '@expo/vector-icons'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { ComponentProps } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Agendamento from './Agendamento'
import Descoberta from './Descoberta'
import Inicio from './Inicio'
import { Administracao, Configuracoes, Operacao } from './ModuloEmPreparacao'
import AbaPerfilUsuario from './Usuario'

const Tab = createBottomTabNavigator<AbasParamList>()
type NomeIcone = ComponentProps<typeof Ionicons>['name']

function opcoesAba(label: string, icone: NomeIcone) {
    return {
        tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View style={styles.tabScreen}>
                <Ionicons name={icone} size={22} color={focused ? '#E7B84B' : '#8E9AAF'} />
                <Text style={[styles.tabScreenText, { color: focused ? '#E7B84B' : '#8E9AAF' }]}>
                    {label}
                </Text>
            </View>
        ),
    }
}

export default function Abas() {
    const { usuario } = useSessao()
    const perfil = resolverPerfil(usuario)
    const operacional = perfilOperacional(perfil)
    const admin = perfilAdmin(perfil)

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveBackgroundColor: '#081426',
                tabBarInactiveBackgroundColor: '#081426',
                tabBarStyle: { backgroundColor: '#081426', borderTopColor: '#26364E' },
            }}
        >
            <Tab.Screen name="Descobrir" component={Descoberta} options={opcoesAba('Descobrir', 'search-outline')} />
            <Tab.Screen name="Inicio" component={Inicio} options={opcoesAba('Início', 'home-outline')} />
            <Tab.Screen
                name="Agendamento"
                component={Agendamento}
                options={opcoesAba('Agendar', 'calendar-outline')}
            />
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
    tabScreenText: { fontSize: 10, fontWeight: '700' },
})
