'use client'
import { Usuario } from '@uniflowabs/core'
import { createContext, useCallback, useEffect, useState } from 'react'
import cookie from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

const URL_BASE = process.env.NEXT_PUBLIC_API_URL

interface Sessao {
    token: string | null
    usuario: Usuario | null
}

interface ContextoSessaoProps {
    carregando: boolean
    token: string | null
    usuario: Usuario | null
    iniciarSessao: (token: string) => void
    encerrarSessao: () => void
}

const ContextoSessao = createContext<ContextoSessaoProps>({} as any)
export default ContextoSessao

export function ProvedorSessao(props: any) {
    const nomeCookie = '_barberflowabs_token'

    const [carregando, setCarregando] = useState(true)
    const [sessao, setSessao] = useState<Sessao>({ token: null, usuario: null })

    const carregarSessao = useCallback(async function () {
        try {
            setCarregando(true)
            const sessao = obterSessao()
            const tokenAtualizado = sessao.token ? await renovarToken(sessao.token) : null

            if (tokenAtualizado) {
                cookie.set(nomeCookie, tokenAtualizado, { expires: 1 })
                setSessao(obterSessao(tokenAtualizado))
                return
            }

            setSessao(sessao)
        } finally {
            setCarregando(false)
        }
    }, [])

    useEffect(() => {
        carregarSessao()
    }, [carregarSessao])

    function iniciarSessao(token: string) {
        cookie.set(nomeCookie, token, { expires: 1 })
        const sessao = obterSessao(token)
        setSessao(sessao)
    }

    function encerrarSessao() {
        cookie.remove(nomeCookie)
        setSessao({ token: null, usuario: null })
    }

    function obterSessao(tokenRecebido?: string): Sessao {
        const token = tokenRecebido ?? cookie.get(nomeCookie)

        if (!token) {
            return { token: null, usuario: null }
        }

        try {
            const payload: any = jwtDecode(token)
            const valido = payload.exp! > Date.now() / 1000

            if (!valido) {
                return { token: null, usuario: null }
            }

            return {
                token,
                usuario: {
                    id: payload.id,
                    estabelecimentoId: payload.estabelecimentoId ?? undefined,
                    nome: payload.nome,
                    email: payload.email,
                    membroEstabelecimento: payload.membroEstabelecimento,
                    papel: payload.papel ?? payload.role,
                    role: payload.role,
                    telefone: payload.telefone,
                },
            }
        } catch (e) {
            return { token: null, usuario: null }
        }
    }

    async function renovarToken(token: string) {
        if (!URL_BASE) return null

        try {
            const resposta = await fetch(`${URL_BASE}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            })
            const texto = await resposta.text()
            return resposta.ok && texto ? texto : null
        } catch (e) {
            return null
        }
    }

    return (
        <ContextoSessao.Provider
            value={{
                carregando,
                token: sessao.token,
                usuario: sessao.usuario,
                iniciarSessao,
                encerrarSessao,
            }}
        >
            {props.children}
        </ContextoSessao.Provider>
    )
}
