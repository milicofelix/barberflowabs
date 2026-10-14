'use client'

import { useCallback, useEffect, useState } from 'react'
import useSessao from './useSessao'
import {
    estaNoFluxoDeAgendamentoCliente,
    EVENTO_ESTABELECIMENTO_SELECIONADO,
    obterEstabelecimentoSelecionado,
} from '../tenant/estabelecimentoSelecionado'

const URL_BASE = process.env.NEXT_PUBLIC_API_URL

export default function useAPI() {
    const { token, usuario } = useSessao()
    const [estabelecimentoSlug, setEstabelecimentoSlug] = useState(obterEstabelecimentoSelecionado)

    useEffect(() => {
        function atualizar(evento: Event) {
            const slug = (evento as CustomEvent<string>).detail
            setEstabelecimentoSlug(slug || obterEstabelecimentoSelecionado())
        }

        setEstabelecimentoSlug(obterEstabelecimentoSelecionado())
        window.addEventListener(EVENTO_ESTABELECIMENTO_SELECIONADO, atualizar)

        return () => window.removeEventListener(EVENTO_ESTABELECIMENTO_SELECIONADO, atualizar)
    }, [])

    const headersTenant = useCallback(
        function headersTenant() {
            const fluxoCliente = estaNoFluxoDeAgendamentoCliente()

            return {
                Authorization: `Bearer ${token}`,
                'x-estabelecimento-slug': estabelecimentoSlug,
                ...(usuario?.membroEstabelecimento && usuario?.estabelecimentoId && !fluxoCliente ? { 'x-estabelecimento-id': String(usuario.estabelecimentoId) } : {}),
            }
        },
        [estabelecimentoSlug, token, usuario?.estabelecimentoId, usuario?.membroEstabelecimento]
    )

    const httpGet = useCallback(
        async function (caminho: string) {
            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const urlCompleta = `${URL_BASE}${uri}`

            try {
                const resposta = await fetch(urlCompleta, {
                    headers: headersTenant(),
                })
                return extrairDados(resposta)
            } catch (e) {
                return erroConexao(urlCompleta)
            }
        },
        [headersTenant]
    )

    const httpPost = useCallback(
        async function (caminho: string, body: any) {
            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const urlCompleta = `${URL_BASE}${uri}`

            try {
                const resposta = await fetch(urlCompleta, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headersTenant(),
                    },
                    body: JSON.stringify(body),
                })
                return extrairDados(resposta)
            } catch (e) {
                return erroConexao(urlCompleta)
            }
        },
        [headersTenant]
    )

    const httpPut = useCallback(
        async function (caminho: string, body: any) {
            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const urlCompleta = `${URL_BASE}${uri}`

            try {
                const resposta = await fetch(urlCompleta, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...headersTenant(),
                    },
                    body: JSON.stringify(body),
                })
                return extrairDados(resposta)
            } catch (e) {
                return erroConexao(urlCompleta)
            }
        },
        [headersTenant]
    )

    const httpDelete = useCallback(
        async function (caminho: string) {
            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const urlCompleta = `${URL_BASE}${uri}`

            try {
                const resposta = await fetch(urlCompleta, {
                    method: 'DELETE',
                    headers: headersTenant(),
                })
                return extrairDados(resposta)
            } catch (e) {
                return erroConexao(urlCompleta)
            }
        },
        [headersTenant]
    )

    async function extrairDados(resposta: Response) {
        let conteudo = ''
        try {
            conteudo = await resposta.text()
            return JSON.parse(conteudo)
        } catch (e) {
            return conteudo
        }
    }

    function erroConexao(url: string) {
        return {
            statusCode: 0,
            message: `Não foi possível conectar à API em ${url}`,
        }
    }

    const httpUpload = useCallback((arquivo: File, finalidade: string, progresso: (valor: number) => void, global = false) => new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${URL_BASE}/midias/${global ? 'admin/upload' : 'upload'}`)
        Object.entries(headersTenant()).forEach(([chave, valor]) => xhr.setRequestHeader(chave, String(valor)))
        xhr.upload.onprogress = (evento) => { if (evento.lengthComputable) progresso(Math.round(evento.loaded * 100 / evento.total)) }
        xhr.onerror = () => reject(new Error('Não foi possível enviar a imagem. Tente novamente.'))
        xhr.timeout = 120_000
        xhr.ontimeout = () => reject(new Error('O envio demorou demais. Tente novamente.'))
        xhr.onload = () => {
            try {
                const dados = JSON.parse(xhr.responseText)
                if (xhr.status < 200 || xhr.status >= 300) reject(new Error(dados.message ?? 'Não foi possível enviar a imagem'))
                else resolve(dados)
            } catch { reject(new Error('Resposta inválida ao enviar imagem')) }
        }
        const body = new FormData(); body.append('arquivo', arquivo); body.append('finalidade', finalidade)
        xhr.send(body)
    }), [headersTenant])

    return { httpGet, httpPost, httpPut, httpDelete, httpUpload }
}
