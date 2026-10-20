import { useCallback } from 'react'
import useSessao from './useSessao'
import useEstabelecimento from './useEstabelecimento'
import type { FinalidadeMidia, ImagemGaleria } from '@uniflowabs/core'

const URL_BASE = process.env.API_URL

type EscopoTenant = 'automatico' | 'publico' | 'nenhum'
const ATRASO_NOVA_TENTATIVA_GET_MS = 500

interface OpcoesRequisicao {
    escopoTenant?: EscopoTenant
}

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
    const { estabelecimento } = useEstabelecimento()

    const executar = useCallback(
        async function executar<T>(
            metodo: 'GET' | 'POST' | 'PUT' | 'DELETE',
            caminho: string,
            body?: unknown,
            opcoes: OpcoesRequisicao = {}
        ) {
            if (!URL_BASE) throw new ErroAPI('A URL da API não foi configurada.', 0)

            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const papel = String(usuario?.role ?? usuario?.papel ?? '').toUpperCase()
            const operacional = papel === 'ESTABLISHMENT_MEMBER' || papel === 'ESTABLISHMENT_OWNER' || !!usuario?.membroEstabelecimento
            const escopoTenant = opcoes.escopoTenant ?? 'automatico'
            const headers: Record<string, string> = {}

            if (escopoTenant === 'publico') {
                if (!estabelecimento?.slug) {
                    throw new ErroAPI('Escolha um estabelecimento antes de continuar.', 400)
                }
                headers['x-estabelecimento-slug'] = estabelecimento.slug
            } else if (escopoTenant === 'automatico') {
                if (operacional && usuario?.estabelecimentoId) {
                    headers['x-estabelecimento-id'] = String(usuario.estabelecimentoId)
                } else if (estabelecimento?.slug) {
                    headers['x-estabelecimento-slug'] = estabelecimento.slug
                }
            }

            if (token) headers.Authorization = `Bearer ${token}`
            if (body !== undefined) headers['Content-Type'] = 'application/json'

            let resposta: Response | null = null
            const totalTentativas = metodo === 'GET' ? 2 : 1
            for (let tentativa = 1; tentativa <= totalTentativas; tentativa += 1) {
                try {
                    resposta = await fetch(`${URL_BASE}${uri}`, {
                        method: metodo,
                        headers,
                        body: body === undefined ? undefined : JSON.stringify(body),
                    })
                    break
                } catch {
                    if (tentativa === totalTentativas) {
                        throw new ErroAPI('Não foi possível conectar ao servidor.', 0)
                    }
                    await new Promise((resolver) => setTimeout(resolver, ATRASO_NOVA_TENTATIVA_GET_MS))
                }
            }
            if (!resposta) throw new ErroAPI('Não foi possível conectar ao servidor.', 0)

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
        [estabelecimento?.slug, encerrarSessao, token, usuario?.estabelecimentoId, usuario?.membroEstabelecimento, usuario?.papel, usuario?.role]
    )

    const httpGet = useCallback(<T,>(caminho: string, opcoes?: OpcoesRequisicao) => executar<T>('GET', caminho, undefined, opcoes), [executar])
    const httpPost = useCallback(<T,>(caminho: string, body?: unknown, opcoes?: OpcoesRequisicao) => executar<T>('POST', caminho, body, opcoes), [executar])
    const httpPut = useCallback(<T,>(caminho: string, body?: unknown, opcoes?: OpcoesRequisicao) => executar<T>('PUT', caminho, body, opcoes), [executar])
    const httpDelete = useCallback(<T,>(caminho: string, body?: unknown, opcoes?: OpcoesRequisicao) => executar<T>('DELETE', caminho, body, opcoes), [executar])

    const httpUpload = useCallback((uri: string, finalidade: FinalidadeMidia, progresso: (valor: number) => void, global = false) => new Promise<ImagemGaleria>((resolve, reject) => {
        if (!URL_BASE) { reject(new Error('API não configurada')); return }
        const xhr = new XMLHttpRequest(); xhr.open('POST', `${URL_BASE}/midias/${global ? 'admin/upload' : 'upload'}`)
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) progresso(Math.round(e.loaded * 100 / e.total)) }
        xhr.onerror = () => reject(new Error('Falha de conexão ao enviar a foto. Tente novamente.'))
        xhr.timeout = 120000; xhr.ontimeout = () => reject(new Error('O envio demorou demais. Tente novamente.'))
        xhr.onload = () => {
            try {
                const dados = JSON.parse(xhr.responseText)
                if (xhr.status < 200 || xhr.status >= 300) { if (xhr.status === 401) void encerrarSessao(); reject(new Error(mensagemDaResposta(dados, xhr.status))) }
                else resolve(dados)
            } catch { reject(new Error('Resposta inválida ao enviar foto')) }
        }
        const body = new FormData(); body.append('finalidade', finalidade)
        body.append('arquivo', { uri, name: finalidade === 'LOGO' ? 'logo.png' : 'foto.jpg', type: finalidade === 'LOGO' ? 'image/png' : 'image/jpeg' } as any)
        xhr.send(body)
    }), [token, encerrarSessao])

    return { httpGet, httpPost, httpPut, httpDelete, httpUpload }
}
