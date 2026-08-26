import { useCallback } from 'react'
import useSessao from './useSessao'

const URL_BASE = process.env.API_URL
const BARBEARIA_SLUG = process.env.BARBEARIA_SLUG ?? 'barber-flow-abs'

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
            const resposta = await fetch(urlCompleta, {
                headers: headersTenant(),
            })
            return extrairDados(resposta)
        },
        [headersTenant]
    )

    const httpPost = useCallback(
        async function httpPost(caminho: string, body: any) {
            try {
                const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
                const urlCompleta = `${URL_BASE}${uri}`

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
                console.error(e)
                return null
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

    return { httpGet, httpPost }
}
