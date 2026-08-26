'use client'

import { useCallback } from 'react'
import useSessao from './useSessao'

const URL_BASE = process.env.NEXT_PUBLIC_API_URL
const BARBEARIA_SLUG = process.env.NEXT_PUBLIC_BARBEARIA_SLUG ?? 'barber-flow-abs'

export default function useAPI() {
    const { token, usuario } = useSessao()

    const headersTenant = useCallback(
        function headersTenant() {
            return {
                Authorization: `Bearer ${token}`,
                'x-barbearia-slug': BARBEARIA_SLUG,
                ...(usuario?.barbeariaId ? { 'x-barbearia-id': String(usuario.barbeariaId) } : {}),
            }
        },
        [token, usuario?.barbeariaId]
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

    return { httpGet, httpPost, httpPut, httpDelete }
}
