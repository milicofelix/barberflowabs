export type StatusTourMapa = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'PULADO'
export type PosicaoPassoTour = 'ACIMA' | 'ABAIXO' | 'AUTOMATICA'

export interface EstadoTourMapa {
    versao: number
    status: StatusTourMapa
    passoAtual: number
    atualizadoEm: string
}

export interface PassoTour {
    id: string
    alvo: string
    titulo: string
    descricao: string
    posicao: PosicaoPassoTour
    indisponivel: 'EXPLICAR' | 'PULAR'
    interacao?: 'SELECIONAR_MARCADOR'
}

export interface DefinicaoTour {
    id: string
    versao: number
    chavePersistencia: string
    /** Só deve mudar mediante decisão explícita de produto. */
    reiniciarAutomaticamenteNovaVersao: boolean
    passos: readonly PassoTour[]
}

export interface PersistenciaTour {
    ler(chave: string): Promise<string | null>
    salvar(chave: string, valor: string): Promise<void>
}

/** Não admite coordenadas, textos pesquisados ou identidade do cliente/unidade. */
export interface EventoTour {
    tourId: string
    versao: number
    passoId: string
    tipo: 'INICIO' | 'AVANCO' | 'RETORNO' | 'CONCLUSAO' | 'ABANDONO' | 'REINICIO'
}

export function novoEstadoTour(versao: number, agora: string): EstadoTourMapa {
    return { versao, status: 'NAO_INICIADO', passoAtual: 0, atualizadoEm: agora }
}

export function lerEstadoTour(texto: string): EstadoTourMapa | null {
    try {
        const estado = JSON.parse(texto)
        if (!estado || !Number.isSafeInteger(estado.versao) || estado.versao < 1
            || !['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'PULADO'].includes(estado.status)
            || !Number.isSafeInteger(estado.passoAtual) || estado.passoAtual < 0
            || typeof estado.atualizadoEm !== 'string' || !Number.isFinite(Date.parse(estado.atualizadoEm))) return null
        return { versao: estado.versao, status: estado.status, passoAtual: estado.passoAtual, atualizadoEm: estado.atualizadoEm }
    } catch { return null }
}

export const TOUR_MAPA: DefinicaoTour = {
    id: 'mapa', versao: 1, chavePersistencia: '@uniflowabs/tour_mapa:v1',
    reiniciarAutomaticamenteNovaVersao: false,
    passos: [
        { id: 'apresentacao', alvo: 'descoberta.cabecalho', titulo: 'Descubra novos atendimentos', descricao: 'Encontre serviços e estabelecimentos perto de você.' },
        { id: 'visualizacao', alvo: 'descoberta.visualizacao', titulo: 'Lista ou mapa', descricao: 'Alterne entre cartões e localização no mapa sem perder seus filtros.' },
        { id: 'categorias', alvo: 'descoberta.categorias', titulo: 'Escolha uma categoria', descricao: 'Escolha barbearia, beleza, manicure, spa e outros segmentos.' },
        { id: 'filtros', alvo: 'descoberta.filtros', titulo: 'Refine sua busca', descricao: 'Filtre por cidade, especialidade, preço, avaliação, disponibilidade e distância.' },
        { id: 'distancia', alvo: 'descoberta.sem-limite', titulo: 'Distância da busca', descricao: 'Use uma distância específica ou veja todos os resultados com Sem limite.' },
        { id: 'localizacao', alvo: 'descoberta.localizar', titulo: 'Sua localização é opcional', descricao: 'Se desejar, use Localizar e autorize sua localização. Avançar neste tour não solicita permissão.' },
        { id: 'marcadores', alvo: 'descoberta.marcadores', titulo: 'Conheça os marcadores', descricao: 'Cada ícone representa o segmento do estabelecimento. Sem resultados, você pode continuar normalmente.' },
        { id: 'perfil', alvo: 'descoberta.selecionado', titulo: 'Veja os detalhes', descricao: 'Toque em um marcador ou cartão para consultar serviços, preços, horários e iniciar um agendamento.' },
    ].map<PassoTour>(passo => ({ ...passo, posicao: 'AUTOMATICA', indisponivel: 'EXPLICAR',
        ...(['marcadores', 'perfil'].includes(passo.id) ? { interacao: 'SELECIONAR_MARCADOR' as const } : {}),
    })),
}
