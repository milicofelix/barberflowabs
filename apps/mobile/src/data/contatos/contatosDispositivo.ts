import { Contact, ContactField, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts'
import { Linking, Platform } from 'react-native'

export type EstadoPermissaoContatos = 'NAO_SOLICITADA' | 'CONCEDIDA' | 'LIMITADA' | 'NEGADA' | 'BLOQUEADA' | 'INDISPONIVEL'

export const MENSAGEM_PERMISSAO_CONTATOS = 'Escolha quais contatos deseja consultar para cadastrá-los como clientes do estabelecimento. Nada será importado sem sua revisão e confirmação.'

export interface PermissaoContatosDispositivo {
    estado: EstadoPermissaoContatos
    podeSolicitarNovamente: boolean
}

export interface ContatoDispositivo {
    referencia: string
    nome: string
    telefones: Array<{ rotulo?: string; numero: string }>
    emails: Array<{ rotulo?: string; email: string }>
}

export interface PaginaContatosDispositivo {
    contatos: ContatoDispositivo[]
    totalDisponivel: number
    proximoOffset: number | null
}

const CAMPOS_PERMITIDOS = [ContactField.FULL_NAME, ContactField.PHONES, ContactField.EMAILS] as const

export async function consultarPermissaoContatos(): Promise<PermissaoContatosDispositivo> {
    if (Platform.OS === 'web') return { estado: 'INDISPONIVEL', podeSolicitarNovamente: false }
    return traduzirPermissao(await getPermissionsAsync())
}

export async function solicitarPermissaoContatos(): Promise<PermissaoContatosDispositivo> {
    if (Platform.OS === 'web') return { estado: 'INDISPONIVEL', podeSolicitarNovamente: false }
    return traduzirPermissao(await requestPermissionsAsync())
}

export async function lerContatosPermitidos(offset = 0, limite = 200): Promise<PaginaContatosDispositivo> {
    const permissao = await consultarPermissaoContatos()
    if (!['CONCEDIDA', 'LIMITADA'].includes(permissao.estado)) {
        throw new Error('Acesso aos contatos não autorizado')
    }
    const tamanhoPagina = Math.min(500, Math.max(1, limite))
    const [detalhes, totalDisponivel] = await Promise.all([
        Contact.getAllDetails(CAMPOS_PERMITIDOS, { offset: Math.max(0, offset), limit: tamanhoPagina }),
        Contact.getCount(),
    ])
    const contatos = detalhes.map((item: any) => ({
        referencia: String(item.id),
        nome: String(item.fullName ?? '').trim(),
        telefones: (item.phones ?? []).flatMap((telefone: any) => telefone?.number
            ? [{ rotulo: telefone.label || undefined, numero: String(telefone.number) }] : []),
        emails: (item.emails ?? []).flatMap((email: any) => email?.address
            ? [{ rotulo: email.label || undefined, email: String(email.address).trim().toLowerCase() }] : []),
    }))
    const proximoOffset = offset + detalhes.length < totalDisponivel ? offset + detalhes.length : null
    return { contatos, totalDisponivel, proximoOffset }
}

export function abrirConfiguracoesDoAplicativo() {
    return Linking.openSettings()
}

function traduzirPermissao(permissao: { status: string; canAskAgain: boolean; accessPrivileges?: 'all' | 'limited' | 'none' }): PermissaoContatosDispositivo {
    if (permissao.status === 'granted') {
        return { estado: permissao.accessPrivileges === 'limited' ? 'LIMITADA' : 'CONCEDIDA', podeSolicitarNovamente: false }
    }
    if (permissao.status === 'undetermined') return { estado: 'NAO_SOLICITADA', podeSolicitarNovamente: true }
    return { estado: permissao.canAskAgain ? 'NEGADA' : 'BLOQUEADA', podeSolicitarNovamente: permissao.canAskAgain }
}
