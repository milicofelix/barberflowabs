import {
    abrirConfiguracoesDoAplicativo, consultarPermissaoContatos, type ContatoDispositivo,
    type EstadoPermissaoContatos, lerContatosPermitidos, MENSAGEM_PERMISSAO_CONTATOS, solicitarPermissaoContatos,
} from '@/src/data/contatos/contatosDispositivo'
import { useCallback, useEffect, useRef, useState } from 'react'

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
    const carregandoRef = useRef(false)
    const contatosRef = useRef<ContatoDispositivo[]>([])
    const proximoOffsetRef = useRef<number | null>(0)

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
        const offset = reiniciar ? 0 : proximoOffsetRef.current
        if (offset === null || carregandoRef.current) return
        carregandoRef.current = true
        setCarregando(true); setErro(null)
        try {
            const pagina = await lerContatosPermitidos(offset)
            const acumulados = reiniciar ? pagina.contatos : [...contatosRef.current, ...pagina.contatos]
            const unicos = Array.from(new Map(acumulados.map((contato) => [contato.referencia, contato])).values())
            const limitados = unicos.slice(0, LIMITE_CONTATOS_EM_MEMORIA)
            contatosRef.current = limitados
            setContatos(limitados)
            setTotalDisponivel(pagina.totalDisponivel)
            const atingiuLimite = limitados.length >= LIMITE_CONTATOS_EM_MEMORIA && pagina.proximoOffset !== null
            setLimiteLocalAtingido(atingiuLimite)
            const novoOffset = atingiuLimite ? null : pagina.proximoOffset
            proximoOffsetRef.current = novoOffset
            setProximoOffset(novoOffset)
        } catch (error: any) {
            setErro(error?.message ?? 'Não foi possível ler os contatos autorizados.')
            await atualizarPermissao().catch(() => undefined)
        } finally {
            carregandoRef.current = false
            setCarregando(false)
        }
    }, [atualizarPermissao])

    return {
        estado, podeSolicitarNovamente, contatos, totalDisponivel, proximoOffset,
        carregando, erro, limiteLocalAtingido, solicitar, carregar, atualizarPermissao,
        mensagemPermissao: MENSAGEM_PERMISSAO_CONTATOS,
        abrirConfiguracoes: abrirConfiguracoesDoAplicativo,
    }
}
