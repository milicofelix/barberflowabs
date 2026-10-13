import {
    abrirConfiguracoesDoAplicativo, consultarPermissaoContatos, type ContatoDispositivo,
    type EstadoPermissaoContatos, lerContatosPermitidos, MENSAGEM_PERMISSAO_CONTATOS, solicitarPermissaoContatos,
} from '@/src/data/contatos/contatosDispositivo'
import { useCallback, useEffect, useState } from 'react'

const LIMITE_CONTATOS_EM_MEMORIA = 2_000

export default function useContatosDispositivo() {
    const [estado, setEstado] = useState<EstadoPermissaoContatos>('NAO_SOLICITADA')
    const [podeSolicitarNovamente, setPodeSolicitarNovamente] = useState(true)
    const [contatos, setContatos] = useState<ContatoDispositivo[]>([])
    const [totalDisponivel, setTotalDisponivel] = useState(0)
    const [proximoOffset, setProximoOffset] = useState<number | null>(0)
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [limiteLocalAtingido, setLimiteLocalAtingido] = useState(false)

    const atualizarPermissao = useCallback(async () => {
        const permissao = await consultarPermissaoContatos()
        setEstado(permissao.estado)
        setPodeSolicitarNovamente(permissao.podeSolicitarNovamente)
        return permissao
    }, [])

    useEffect(() => { atualizarPermissao().catch(() => setEstado('INDISPONIVEL')) }, [atualizarPermissao])

    const solicitar = useCallback(async () => {
        setErro(null)
        try {
            const permissao = await solicitarPermissaoContatos()
            setEstado(permissao.estado)
            setPodeSolicitarNovamente(permissao.podeSolicitarNovamente)
            return permissao
        } catch {
            setErro('Não foi possível solicitar acesso aos contatos.')
            return null
        }
    }, [])

    const carregar = useCallback(async (reiniciar = false) => {
        const offset = reiniciar ? 0 : proximoOffset
        if (offset === null || carregando) return
        setCarregando(true); setErro(null)
        try {
            const pagina = await lerContatosPermitidos(offset)
            const acumulados = reiniciar ? pagina.contatos : [...contatos, ...pagina.contatos]
            const limitados = acumulados.slice(0, LIMITE_CONTATOS_EM_MEMORIA)
            setContatos(limitados)
            setTotalDisponivel(pagina.totalDisponivel)
            const atingiuLimite = limitados.length >= LIMITE_CONTATOS_EM_MEMORIA && pagina.proximoOffset !== null
            setLimiteLocalAtingido(atingiuLimite)
            setProximoOffset(atingiuLimite ? null : pagina.proximoOffset)
        } catch (error: any) {
            setErro(error?.message ?? 'Não foi possível ler os contatos autorizados.')
            await atualizarPermissao().catch(() => undefined)
        } finally { setCarregando(false) }
    }, [atualizarPermissao, carregando, contatos, proximoOffset])

    return {
        estado, podeSolicitarNovamente, contatos, totalDisponivel, proximoOffset,
        carregando, erro, limiteLocalAtingido, solicitar, carregar, atualizarPermissao,
        mensagemPermissao: MENSAGEM_PERMISSAO_CONTATOS,
        abrirConfiguracoes: abrirConfiguracoesDoAplicativo,
    }
}
