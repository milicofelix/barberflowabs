'use client'
import { createContext, useCallback, useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { Usuario } from '@barbabrutal/core'
import useLocalStorage from '../hooks/useLocalStorage'

interface Sessao {
    token: string | null
    usuario: Usuario | null
}

interface ContextoSessaoProps {
    carregando: boolean
    token: string | null
    usuario: Usuario | null
    iniciarSessao: (token: string) => Promise<void>
    encerrarSessao: () => Promise<void>
}

const ContextoSessao = createContext<ContextoSessaoProps>({} as any)
export default ContextoSessao

export function ProvedorSessao(props: any) {
    const tokenNome = '_barbabrutal_token'
    const { get, set, remove } = useLocalStorage()

    const [carregando, setCarregando] = useState(true)
    const [sessao, setSessao] = useState<Sessao>({ token: null, usuario: null })

    const obterSessao = useCallback(
        async function (): Promise<Sessao> {
            const token = await get(tokenNome)

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
                        nome: payload.nome,
                        email: payload.email,
                        barbeiro: payload.barbeiro,
                        telefone: payload.telefone,
                    },
                }
            } catch (e) {
                return { token: null, usuario: null }
            }
        },
        [get]
    )

    const iniciarSessao = useCallback(
        async function (token: string) {
            await set(tokenNome, token)
            const sessao = await obterSessao()
            setSessao(sessao)
        },
        [obterSessao, set]
    )

    const encerrarSessao = useCallback(
        async function () {
            await remove(tokenNome)
            setSessao({ token: null, usuario: null })
        },
        [remove]
    )

    const carregarSessao = useCallback(
        async function () {
            try {
                setCarregando(true)
                const sessao = await obterSessao()
                setSessao(sessao)
            } finally {
                setCarregando(false)
            }
        },
        [obterSessao]
    )

    useEffect(() => {
        carregarSessao()
    }, [carregarSessao])

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
