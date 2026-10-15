import { useCallback, useEffect, useRef, useState } from 'react'
import { Keyboard } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import { useTour } from '@/src/components/tour/ContextoTour'
import type { AcaoContextualTour } from '@/src/components/tour/SobreposicaoTour'

interface Opcoes {
    mapaVisivel: boolean; mapaPronto: boolean; carregandoResultados: boolean
    pedidoManual?: number; filtrosAbertos: boolean; temMarcadores: boolean; temSelecionado: boolean
    abrirMapa: () => void; consumirPedido: () => void
    alterarMapaVisivel: (visivel: boolean) => void
    alterarFiltrosAbertos: (aberto: boolean) => void
    obterDeslocamento: () => number; rolar: (offset: number) => void
    abrirSelecionado: () => void
}

/** Só coordena apresentação: não recebe setter de filtros, localização ou câmera. */
export default function useTourDescoberta(opcoes: Opcoes) {
    const { controlador, alvos, aberto, estado, carregando, erro } = useTour()
    const foco = useIsFocused()
    const atual = useRef(opcoes); atual.current = opcoes
    const [sessaoAtiva, setSessaoAtiva] = useState(false)
    const [interagindo, setInteragindo] = useState(false)
    const interacaoLiberada = useRef(false)
    const [teclado, setTeclado] = useState(false)
    const [mediuTela, setMediuTela] = useState(false)
    const [esperaMapaEncerrada, setEsperaMapaEncerrada] = useState(false)
    const restauracao = useRef<{ offset: number; filtrosAbertos: boolean; mapaVisivel: boolean } | null>(null)
    const preparacaoManual = useRef<typeof restauracao.current>(null)
    const pedidoPreparado = useRef<number | undefined>(undefined)
    const revisaoRolagem = useRef(0)
    const timerRolagem = useRef<ReturnType<typeof setTimeout> | null>(null)
    const rolagemPendente = useRef<{ offset: number; ate: number } | null>(null)
    const passo = controlador.definicao.passos[estado.passoAtual] ?? controlador.definicao.passos[0]!

    useEffect(() => {
        const mostrar = Keyboard.addListener('keyboardDidShow', () => setTeclado(true))
        const esconder = Keyboard.addListener('keyboardDidHide', () => setTeclado(false))
        return () => { mostrar.remove(); esconder.remove() }
    }, [])
    useEffect(() => {
        setEsperaMapaEncerrada(false)
        if (!opcoes.mapaVisivel || opcoes.carregandoResultados) return
        const timer = setTimeout(() => setEsperaMapaEncerrada(true), 1800)
        return () => clearTimeout(timer)
    }, [opcoes.mapaVisivel, opcoes.carregandoResultados])
    useEffect(() => {
        if (foco && opcoes.pedidoManual && pedidoPreparado.current !== opcoes.pedidoManual) {
            pedidoPreparado.current = opcoes.pedidoManual
            preparacaoManual.current = { offset: atual.current.obterDeslocamento(), filtrosAbertos: atual.current.filtrosAbertos, mapaVisivel: atual.current.mapaVisivel }
            Keyboard.dismiss(); atual.current.abrirMapa()
        }
    }, [foco, opcoes.pedidoManual])

    const restaurar = useCallback(() => {
        const salvo = restauracao.current
        restauracao.current = null
        revisaoRolagem.current++
        interacaoLiberada.current = false
        setSessaoAtiva(false); setInteragindo(false)
        if (!salvo) return
        atual.current.alterarFiltrosAbertos(salvo.filtrosAbertos)
        atual.current.alterarMapaVisivel(salvo.mapaVisivel)
        rolagemPendente.current = { offset: salvo.offset, ate: Date.now() + 1500 }
        if (timerRolagem.current) clearTimeout(timerRolagem.current)
        timerRolagem.current = setTimeout(() => atual.current.rolar(salvo.offset), 100)
    }, [])

    useEffect(() => {
        if (!foco || teclado || carregando || sessaoAtiva || !mediuTela || !opcoes.mapaVisivel || opcoes.carregandoResultados
            || (!opcoes.mapaPronto && !esperaMapaEncerrada)) return
        const timer = setTimeout(() => {
            if (timerRolagem.current) clearTimeout(timerRolagem.current)
            revisaoRolagem.current++
            rolagemPendente.current = null
            const salvo = preparacaoManual.current ?? { offset: atual.current.obterDeslocamento(), filtrosAbertos: atual.current.filtrosAbertos, mapaVisivel: atual.current.mapaVisivel }
            preparacaoManual.current = null
            const iniciou = atual.current.pedidoManual ? controlador.reiniciar() : controlador.iniciar(true)
            if (iniciou) { restauracao.current = salvo; setSessaoAtiva(true) }
            if (atual.current.pedidoManual) {
                atual.current.consumirPedido()
                if (!iniciou) { restauracao.current = salvo; restaurar() }
            }
        }, 350)
        return () => clearTimeout(timer)
    }, [carregando, controlador, esperaMapaEncerrada, foco, mediuTela, opcoes.mapaPronto, opcoes.mapaVisivel, opcoes.carregandoResultados, opcoes.pedidoManual, restaurar, sessaoAtiva, teclado])

    useEffect(() => {
        if (sessaoAtiva && !aberto && !interagindo && ['CONCLUIDO', 'PULADO'].includes(estado.status)) restaurar()
    }, [aberto, estado.status, interagindo, restaurar, sessaoAtiva])
    useEffect(() => {
        if (!foco && sessaoAtiva) { controlador.suspender(); restaurar() }
    }, [controlador, foco, restaurar, sessaoAtiva])
    useEffect(() => () => { revisaoRolagem.current++; if (timerRolagem.current) clearTimeout(timerRolagem.current) }, [])

    const revelar = useCallback((chave: string) => {
        if (timerRolagem.current) clearTimeout(timerRolagem.current)
        const revisao = ++revisaoRolagem.current
        timerRolagem.current = setTimeout(() => alvos.medir(chave, retangulo => {
            if (revisao !== revisaoRolagem.current) return
            if (retangulo) atual.current.rolar(Math.max(0, atual.current.obterDeslocamento() + retangulo.y - 140))
            alvos.invalidar()
        }), 100)
    }, [alvos])
    const iniciarInteracao = () => {
        if (!sessaoAtiva || interacaoLiberada.current || passo.interacao !== 'SELECIONAR_MARCADOR' || !atual.current.temMarcadores) return
        interacaoLiberada.current = true
        setInteragindo(true); controlador.suspender()
        revelar('descoberta.mapa')
    }
    const retomar = () => {
        if (!interacaoLiberada.current) return
        interacaoLiberada.current = false; setInteragindo(false); controlador.iniciar()
    }
    const selecionouMarcador = () => {
        if (!interacaoLiberada.current) return
        retomar()
        if (passo.id === 'marcadores') controlador.avancar()
        revelar('descoberta.selecionado')
    }
    const pularInteracao = () => {
        if (!interacaoLiberada.current) return
        interacaoLiberada.current = false
        controlador.iniciar(); controlador.pular(); setInteragindo(false); restaurar()
    }
    let acaoContextual: AcaoContextualTour | undefined
    if (passo.id === 'perfil' && opcoes.temSelecionado) {
        acaoContextual = { texto: 'Abrir este estabelecimento', executar: () => {
            if (!restauracao.current) return
            controlador.concluir(); restaurar(); atual.current.abrirSelecionado()
        } }
    } else if (passo.interacao === 'SELECIONAR_MARCADOR' && opcoes.temMarcadores) {
        acaoContextual = { texto: 'Selecionar um marcador no mapa', executar: iniciarInteracao }
    } else if (passo.id === 'distancia' && !opcoes.filtrosAbertos) {
        acaoContextual = { texto: 'Mostrar opções de distância', executar: () => { atual.current.alterarFiltrosAbertos(true); revelar(passo.alvo) } }
    } else if (alvos.possui(passo.alvo)) {
        acaoContextual = { texto: 'Mostrar este elemento na tela', executar: () => revelar(passo.alvo) }
    }
    return { sessaoAtiva, interagindo, selecionouMarcador, retomar, pularInteracao, acaoContextual, erro,
        conteudoAlterado: () => {
            const pendente = rolagemPendente.current
            if (pendente && Date.now() < pendente.ate) atual.current.rolar(pendente.offset)
            else rolagemPendente.current = null
            alvos.invalidar()
        },
        iniciouRolagem: () => { rolagemPendente.current = null },
        invalidar: alvos.invalidar, layoutPronto: () => setMediuTela(true) }
}
