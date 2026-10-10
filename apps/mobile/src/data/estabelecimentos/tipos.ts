export interface EnderecoEstabelecimento {
    logradouro?: string | null
    bairro?: string | null
    cidade?: string | null
    estado?: string | null
    latitude?: number | null
    longitude?: number | null
}

export interface StatusOperacional {
    status: 'ABERTA' | 'ABRE_EM_BREVE' | 'INTERVALO' | 'FECHADA'
    label: string
}

export interface ServicoPublico {
    id: number
    nome: string
    descricao?: string | null
    preco: number
    qtdeSlots: number
    duracaoMinutos: number
    imagemURL?: string | null
    especialidades?: EspecialidadePublica[]
}

export interface SegmentoPublico { id: number; slug: string; nome: string; principal?: boolean }
export interface EspecialidadePublica { id: number; slug: string; nome: string; segmento?: SegmentoPublico }
export interface CategoriaMarketplace extends SegmentoPublico { descricao?: string | null; especialidades: EspecialidadePublica[] }

export interface ProfissionalPublico {
    id: number
    nome: string
    descricao?: string | null
    imagemURL?: string | null
    avaliacao?: number | null
    quantidadeAvaliacoes?: number
}

export interface AvaliacaoPublica {
    id: number
    nota: number
    comentario?: string | null
    criadoEm: string
    cliente?: string | null
    profissional?: string | null
}

export interface HorarioFuncionamento {
    diaSemana: number
    inicio: string
    fim: string
    intervaloInicio?: string | null
    intervaloFim?: string | null
}

export interface EstabelecimentoResumo {
    id: number
    nome: string
    slug: string
    telefone?: string | null
    email?: string | null
    descricao?: string | null
    imagemCapaURL?: string | null
    endereco: EnderecoEstabelecimento
    aceitaAgendamentoOnline: boolean
    destaque: boolean
    distanciaKm: number | null
    statusOperacional: StatusOperacional
    avaliacaoMedia: number | null
    quantidadeAvaliacoes: number
    servicos: ServicoPublico[]
    tipoEstabelecimento?: string
    modeloAtendimento?: string
    segmentos?: SegmentoPublico[]
    especialidades?: EspecialidadePublica[]
    precoInicial?: number
    disponivelEm?: string | null
}

export interface ResultadoMarketplace {
    itens: EstabelecimentoResumo[]
    paginacao: { pagina: number; limite: number; total: number; paginas: number }
}

export interface EstabelecimentoPerfil extends Omit<EstabelecimentoResumo, 'distanciaKm'> {
    profissionais: ProfissionalPublico[]
    avaliacoes: AvaliacaoPublica[]
    horariosFuncionamento: HorarioFuncionamento[]
}

export interface EstabelecimentoSelecionado {
    id: number
    nome: string
    slug: string
    cidade?: string | null
}

export function resumirSelecao(estabelecimento: EstabelecimentoResumo | EstabelecimentoPerfil): EstabelecimentoSelecionado {
    return {
        id: estabelecimento.id,
        nome: estabelecimento.nome,
        slug: estabelecimento.slug,
        cidade: estabelecimento.endereco?.cidade,
    }
}
