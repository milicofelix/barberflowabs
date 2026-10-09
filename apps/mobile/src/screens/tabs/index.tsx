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
import Administracao from './Administracao'
import Configuracoes from './Configuracoes'
import Operacao from './Operacao'
import AbaPerfilUsuario from './Usuario'
import useTema from '@/src/data/contexts/ContextoTema'

const Tab = createBottomTabNavigator<AbasParamList>()
type NomeIcone = ComponentProps<typeof Ionicons>['name']

function opcoesAba(label: string, icone: NomeIcone, ativo: string, inativo: string) {
    return {
        tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View style={styles.tabScreen}>
                <Ionicons name={icone} size={22} color={focused ? ativo : inativo} />
                <Text style={[styles.tabScreenText, { color: focused ? ativo : inativo }]}>
                    {label}
                </Text>
            </View>
        ),
    }
}

export default function Abas() {
    const { cores } = useTema()
    const { usuario } = useSessao()
    const perfil = resolverPerfil(usuario)
    const operacional = perfilOperacional(perfil)
    const admin = perfilAdmin(perfil)

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarActiveBackgroundColor: cores.tabBar,
                tabBarInactiveBackgroundColor: cores.tabBar,
                tabBarStyle: { backgroundColor: cores.tabBar, borderTopColor: cores.borda },
            }}
        >
            <Tab.Screen name="Descobrir" component={Descoberta} options={opcoesAba('Descobrir', 'search-outline', cores.destaque, cores.textoSecundario)} />
            <Tab.Screen name="Inicio" component={Inicio} options={opcoesAba('Início', 'home-outline', cores.destaque, cores.textoSecundario)} />
            <Tab.Screen
                name="Agendamento"
                component={Agendamento}
                options={opcoesAba('Agendar', 'calendar-outline', cores.destaque, cores.textoSecundario)}
            />
            {operacional ? (
                <>
                    <Tab.Screen
                        name="Operacao"
                        component={Operacao}
                        options={opcoesAba('Operação', 'briefcase-outline', cores.destaque, cores.textoSecundario)}
                    />
                    <Tab.Screen
                        name="Configuracoes"
                        component={Configuracoes}
                        options={opcoesAba('Ajustes', 'settings-outline', cores.destaque, cores.textoSecundario)}
                    />
                </>
            ) : null}
            {admin ? (
                <Tab.Screen
                    name="Administracao"
                    component={Administracao}
                    options={opcoesAba('Admin', 'shield-checkmark-outline', cores.destaque, cores.textoSecundario)}
                />
            ) : null}
            <Tab.Screen
                name="Usuario"
                component={AbaPerfilUsuario}
                options={opcoesAba('Perfil', 'person-outline', cores.destaque, cores.textoSecundario)}
            />
        </Tab.Navigator>
    )
}

const styles = StyleSheet.create({
    tabScreen: { flexDirection: 'column', alignItems: 'center' },
    tabScreenText: { fontSize: 10, fontWeight: '700' },
})
