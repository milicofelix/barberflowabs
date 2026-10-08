import { useCallback } from 'react'
import useSessao from './useSessao'
import useBarbearia from './useBarbearia'

const URL_BASE = process.env.API_URL
const BARBEARIA_SLUG = process.env.BARBEARIA_SLUG ?? 'barber-flow-abs'

export class ErroAPI extends Error {
    constructor(
        mensagem: string,
        readonly status: number,
        readonly dados?: unknown
    ) {
        super(mensagem)
        this.name = 'ErroAPI'
    }
}

function mensagemDaResposta(dados: unknown, status: number) {
    if (typeof dados === 'string' && dados.trim()) return dados
    if (dados && typeof dados === 'object' && 'message' in dados) {
        const mensagem = (dados as { message?: string | string[] }).message
        if (Array.isArray(mensagem)) return mensagem.join('\n')
        if (mensagem) return mensagem
    }
    if (status === 401) return 'Sua sessão expirou. Entre novamente.'
    if (status === 403) return 'Você não tem permissão para realizar esta ação.'
    if (status === 404) return 'O recurso solicitado não foi encontrado.'
    if (status >= 500) return 'O servidor encontrou um problema. Tente novamente em instantes.'
    return 'Não foi possível concluir a solicitação.'
}

export function mensagemDoErro(erro: unknown) {
    return erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.'
}

export default function useAPI() {
    const { token, usuario, encerrarSessao } = useSessao()
    const { barbearia } = useBarbearia()

    const executar = useCallback(
        async function executar<T>(metodo: 'GET' | 'POST' | 'PUT' | 'DELETE', caminho: string, body?: unknown) {
            if (!URL_BASE) throw new ErroAPI('A URL da API não foi configurada.', 0)

            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const papel = usuario?.role ?? usuario?.papel
            const cliente = !usuario || papel === 'CUSTOMER'
            const barbeariaId = cliente ? barbearia?.id : usuario?.barbeariaId
            const headers: Record<string, string> = barbeariaId
                ? { 'x-barbearia-id': String(barbeariaId) }
                : { 'x-barbearia-slug': barbearia?.slug ?? BARBEARIA_SLUG }
            if (token) headers.Authorization = `Bearer ${token}`
            if (body !== undefined) headers['Content-Type'] = 'application/json'

            let resposta: Response
            try {
                resposta = await fetch(`${URL_BASE}${uri}`, {
                    method: metodo,
                    headers,
                    body: body === undefined ? undefined : JSON.stringify(body),
                })
            } catch {
                throw new ErroAPI('Não foi possível conectar ao servidor.', 0)
            }

            const texto = await resposta.text()
            let dados: unknown = texto
            if (texto) {
                try {
                    dados = JSON.parse(texto)
                } catch {
                    dados = texto
                }
            } else {
                dados = null
            }

            if (!resposta.ok) {
                if (resposta.status === 401) await encerrarSessao()
                throw new ErroAPI(mensagemDaResposta(dados, resposta.status), resposta.status, dados)
            }

            return dados as T
        },
        [barbearia?.id, barbearia?.slug, encerrarSessao, token, usuario?.barbeariaId, usuario?.papel, usuario?.role]
    )

    const httpGet = useCallback(<T,>(caminho: string) => executar<T>('GET', caminho), [executar])
    const httpPost = useCallback(<T,>(caminho: string, body?: unknown) => executar<T>('POST', caminho, body), [executar])
    const httpPut = useCallback(<T,>(caminho: string, body?: unknown) => executar<T>('PUT', caminho, body), [executar])
    const httpDelete = useCallback(<T,>(caminho: string, body?: unknown) => executar<T>('DELETE', caminho, body), [executar])

    return { httpGet, httpPost, httpPut, httpDelete }
}
