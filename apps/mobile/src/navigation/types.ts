import type { NavigatorScreenParams } from '@react-navigation/native'

export type AbasParamList = {
    Descobrir: undefined
    Inicio: undefined
    Agendamento: { dataInicial?: string; origemAgenda?: boolean; chave?: number } | undefined
    Operacao: { agendamentoId?: number; chave?: number } | undefined
    Configuracoes: undefined
    Administracao: undefined
    Usuario: undefined
}

export type StackParamList = {
    Autenticacao: { destino?: 'Agendamento' | 'Inicio' | 'OnboardingEstabelecimento' } | undefined
    Abas: NavigatorScreenParams<AbasParamList> | undefined
    Sumario: undefined
    PerfilEstabelecimento: { slug: string }
    OnboardingEstabelecimento: undefined
    CentralFinanceira: undefined
}
