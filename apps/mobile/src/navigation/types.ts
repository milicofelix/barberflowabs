import type { NavigatorScreenParams } from '@react-navigation/native'

export type AbasParamList = {
    Descobrir: undefined
    Inicio: undefined
    Agendamento: undefined
    Operacao: undefined
    Configuracoes: undefined
    Administracao: undefined
    Usuario: undefined
}

export type StackParamList = {
    Autenticacao: undefined
    Abas: NavigatorScreenParams<AbasParamList> | undefined
    Sumario: undefined
    PerfilBarbearia: { slug: string }
    OnboardingEstabelecimento: undefined
}
