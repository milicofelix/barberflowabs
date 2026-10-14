import { Usuario } from '@uniflowabs/core'
import { jwtDecode } from 'jwt-decode'
import { createContext, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import useLocalStorage from '../hooks/useLocalStorage'

const URL_BASE = process.env.API_URL
const TOKEN_NOME = '_barberflowabs_token'

interface TokenPayload {
    id: number
    estabelecimentoId?: number | null
    nome: string
    email: string
    membroEstabelecimento?: boolean
    papel?: Usuario['papel'] | 'ESTABLISHMENT_OWNER' | 'APP_OWNER'
    role?: Usuario['role'] | 'ESTABLISHMENT_OWNER' | 'APP_OWNER'
    telefone?: string
    fotoURL?: string | null
    exp?: number
}

interface Sessao {
    token: string | null
    usuario: Usuario | null
}

interface ContextoSessaoProps extends Sessao {
    carregando: boolean
    iniciarSessao: (token: string) => Promise<void>
    renovarSessao: () => Promise<boolean>
    encerrarSessao: () => Promise<void>
}

const ContextoSessao = createContext<ContextoSessaoProps>({} as ContextoSessaoProps)
export default ContextoSessao

function decodificarSessao(token: string): Sessao | null {
    try {
        const payload = jwtDecode<TokenPayload>(token)
        if (!payload.email || !payload.exp || payload.exp <= Date.now() / 1000) return null

        return {
            token,
            usuario: {
                id: payload.id,
                estabelecimentoId: payload.estabelecimentoId ?? undefined,
                nome: payload.nome,
                email: payload.email,
                membroEstabelecimento: payload.membroEstabelecimento,
                papel: payload.papel as Usuario['papel'],
                role: payload.role as Usuario['role'],
                telefone: payload.telefone,
                fotoURL: payload.fotoURL,
            },
        }
    } catch {
        return null
    }
}

export function ProvedorSessao({ children }: { children: ReactNode }) {
    const { get, set, remove } = useLocalStorage()
    const [carregando, setCarregando] = useState(true)
    const [sessao, setSessao] = useState<Sessao>({ token: null, usuario: null })

    const encerrarSessao = useCallback(async () => {
        await remove(TOKEN_NOME)
        setSessao({ token: null, usuario: null })
    }, [remove])

    const iniciarSessao = useCallback(
        async (token: string) => {
            const novaSessao = decodificarSessao(token)
            if (!novaSessao) {
                await encerrarSessao()
                throw new Error('O servidor retornou uma sessão inválida.')
            }

            await set(TOKEN_NOME, token)
            setSessao(novaSessao)
        },
        [encerrarSessao, set]
    )

    const renovarToken = useCallback(async (token: string) => {
        if (!URL_BASE) throw new Error('A URL da API não foi configurada.')

        const resposta = await fetch(`${URL_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        })
        if (resposta.status === 401) return null
        if (!resposta.ok) throw new Error('Não foi possível renovar a sessão.')

        const tokenAtualizado = await resposta.text()
        return tokenAtualizado || null
    }, [])

    const renovarSessao = useCallback(async () => {
        const tokenAtual = sessao.token ?? (await get(TOKEN_NOME))
        if (!tokenAtual || !decodificarSessao(tokenAtual)) {
            await encerrarSessao()
            return false
        }

        try {
            const tokenAtualizado = await renovarToken(tokenAtual)
            if (!tokenAtualizado) {
                await encerrarSessao()
                return false
            }

            await iniciarSessao(tokenAtualizado)
            return true
        } catch {
            setSessao(decodificarSessao(tokenAtual)!)
            return true
        }
    }, [encerrarSessao, get, iniciarSessao, renovarToken, sessao.token])

    const carregarSessao = useCallback(async () => {
        try {
            setCarregando(true)
            const token = await get(TOKEN_NOME)
            if (!token || !decodificarSessao(token)) {
                await encerrarSessao()
                return
            }

            try {
                const tokenAtualizado = await renovarToken(token)
                if (!tokenAtualizado) {
                    await encerrarSessao()
                    return
                }

                await iniciarSessao(tokenAtualizado)
            } catch {
                setSessao(decodificarSessao(token)!)
            }
        } finally {
            setCarregando(false)
        }
    }, [encerrarSessao, get, iniciarSessao, renovarToken])

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
                renovarSessao,
                encerrarSessao,
            }}
        >
            {children}
        </ContextoSessao.Provider>
    )
}
