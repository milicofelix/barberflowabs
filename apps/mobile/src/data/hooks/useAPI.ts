import { useCallback } from 'react'
import useSessao from './useSessao'

const URL_BASE = process.env.API_URL

export default function useAPI() {
    const { token } = useSessao()

    const httpGet = useCallback(
        async function (caminho: string) {
            const uri = caminho.startsWith('/') ? caminho : `/${caminho}`
            const urlCompleta = `${URL_BASE}${uri}`
            const resposta = await fetch(urlCompleta, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            return extrairDados(resposta)
        },
        [token]
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
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                })
                return extrairDados(resposta)
            } catch (e) {
                console.error(e)
                return null
            }
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

    return { httpGet, httpPost }
}
