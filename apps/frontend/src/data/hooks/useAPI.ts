'use client'

import { useCallback } from 'react'
import useSessao from './useSessao'

const URL_BASE = process.env.NEXT_PUBLIC_API_URL
const BARBEARIA_SLUG = process.env.NEXT_PUBLIC_BARBEARIA_SLUG ?? 'barber-flow-abs'

export default function useAPI() {
    const { token } = useSessao()

    const httpGet = useCallback(
        async function (caminho: string) {
            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const urlCompleta = `${URL_BASE}${uri}`

            const resposta = await fetch(urlCompleta, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-barbearia-slug': BARBEARIA_SLUG,
                },
            })
            return extrairDados(resposta)
        },
        [token]
    )

    const httpPost = useCallback(
        async function (caminho: string, body: any) {
            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const urlCompleta = `${URL_BASE}${uri}`

            const resposta = await fetch(urlCompleta, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-barbearia-slug': BARBEARIA_SLUG,
                },
                body: JSON.stringify(body),
            })
            return extrairDados(resposta)
        },
        [token]
    )

    const httpPut = useCallback(
        async function (caminho: string, body: any) {
            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const urlCompleta = `${URL_BASE}${uri}`

            const resposta = await fetch(urlCompleta, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-barbearia-slug': BARBEARIA_SLUG,
                },
                body: JSON.stringify(body),
            })
            return extrairDados(resposta)
        },
        [token]
    )

    const httpDelete = useCallback(
        async function (caminho: string) {
            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const urlCompleta = `${URL_BASE}${uri}`

            const resposta = await fetch(urlCompleta, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'x-barbearia-slug': BARBEARIA_SLUG,
                },
            })
            return extrairDados(resposta)
        },
        [token]
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

    return { httpGet, httpPost, httpPut, httpDelete }
}
