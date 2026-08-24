import { useCallback } from 'react'
import useSessao from './useSessao'

const URL_BASE = process.env.NEXT_PUBLIC_API_URL

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
        async function (caminho: string, body: any) {
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
