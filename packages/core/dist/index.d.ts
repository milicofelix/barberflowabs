type PapelUsuario = 'SUPER_ADMIN' | 'APP_OWNER' | 'ESTABLISHMENT_OWNER' | 'ESTABLISHMENT_MEMBER' | 'CUSTOMER';
interface Usuario {
    id?: number;
    estabelecimentoId?: number;
    nome: string;
    email: string;
    senha?: string;
    telefone?: string;
    fotoURL?: string | null;
    dataNascimento?: string | null;
    membroEstabelecimento?: boolean;
    papel?: PapelUsuario;
    role?: PapelUsuario;
}

interface Profissional {
    id: number;
    estabelecimentoId?: number;
    nome: string;
    descricao: string;
    imagemURL: string;
    avaliacao: number;
    quantidadeAvaliacoes: number;
}

interface Servico {
    id: number;
    estabelecimentoId?: number;
    nome: string;
    descricao: string;
    preco: number;
    qtdeSlots: number;
    imagemURL: string;
    duracaoMinutos?: number;
    preparoAntesMinutos?: number;
    preparoDepoisMinutos?: number;
    deslocamentoMinutos?: number;
    modeloAtendimento?: 'PRESENCIAL' | 'DOMICILIAR' | 'HIBRIDO';
    observacoes?: string | null;
    profissionalIds?: number[];
}

interface Agendamento {
    id: number;
    estabelecimentoId?: number;
    data: Date;
    dataFim?: Date;
    inicioOcupacao?: Date;
    fimOcupacao?: Date;
    unidadeId?: number | null;
    modeloAtendimento?: 'PRESENCIAL' | 'DOMICILIAR' | 'HIBRIDO';
    enderecoAtendimento?: string | null;
    deslocamentoMinutos?: number;
    status?: string;
    estabelecimento?: {
        id: number;
        nome: string;
        slug: string;
    };
    unidade?: {
        id: number;
        nome: string;
    } | null;
    usuario: Usuario;
    profissional: Partial<Profissional>;
    servicos: Partial<Servico>[];
}

interface CasoDeUso<ENTRADA, SAIDA> {
    executar(entrada: ENTRADA): Promise<SAIDA>;
}

interface RepositorioAgendamento {
    criar(agendamento: Agendamento): Promise<void>;
    buscarPorId(id: number): Promise<Agendamento | null>;
    buscarPorEmail(email: string): Promise<Agendamento[]>;
    buscarPorProfissionalEData(profissional: number, data: Date): Promise<Agendamento[]>;
    excluir(id: number): Promise<void>;
}

declare class BuscarAgendamentosCliente implements CasoDeUso<Usuario, Agendamento[]> {
    private readonly repo;
    constructor(repo: RepositorioAgendamento);
    executar(usuario: Usuario): Promise<Agendamento[]>;
}

type Entrada$4 = {
    profissional: number;
    data: Date;
};
declare class BuscarAgendaProfissionalPorDia implements CasoDeUso<Entrada$4, Agendamento[]> {
    private readonly repo;
    constructor(repo: RepositorioAgendamento);
    executar(entrada: Entrada$4): Promise<Agendamento[]>;
}

type Entrada$3 = {
    usuario: Usuario;
    id: number;
};
declare class ExcluirAgendamento implements CasoDeUso<Entrada$3, void> {
    private readonly repo;
    constructor(repo: RepositorioAgendamento);
    executar(entrada: Entrada$3): Promise<void>;
}

declare class Horarios {
    readonly inicio: string;
    readonly qtde: number;
    private readonly horariosOcupados;
    private readonly horariosDisponiveis?;
    constructor(inicio: string, qtde: number, horariosOcupados: string[], horariosDisponiveis?: string[]);
    get todos(): string[];
    get completo(): boolean;
    get incompleto(): boolean;
    get ocupado(): boolean;
    private horariosConsecutivos;
}

type Entrada$2 = {
    agendamento: Agendamento;
    usuario: Usuario;
};
declare class NovoAgendamento implements CasoDeUso<Entrada$2, void> {
    private readonly repo;
    constructor(repo: RepositorioAgendamento);
    executar(entrada: Entrada$2): Promise<void>;
}

type Entrada$1 = {
    profissionalId: number;
    data: Date;
};
declare class ObterHorariosOcupados implements CasoDeUso<Entrada$1, string[]> {
    private readonly repo;
    constructor(repo: RepositorioAgendamento);
    executar(entrada: Entrada$1): Promise<string[]>;
    private somarMinutos;
}

declare const STATUS_AGENDAMENTO: readonly ["AGENDADO", "CONFIRMADO", "ATRASADO", "CHECKIN", "CONCLUIDO", "CANCELADO", "NO_SHOW"];
type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[number];
declare const ORIGENS_TRANSICAO_ATENDIMENTO: readonly ["MANUAL", "AUTOMATICA"];
type OrigemTransicaoAtendimento = (typeof ORIGENS_TRANSICAO_ATENDIMENTO)[number];
declare const TIPOS_TRANSICAO_ATENDIMENTO: readonly ["AVISO", "INICIAR", "FINALIZAR"];
type TipoTransicaoAtendimento = (typeof TIPOS_TRANSICAO_ATENDIMENTO)[number];
declare const STATUS_TRANSICAO_ATENDIMENTO: readonly ["AGENDADA", "PROCESSANDO", "PROCESSADA", "CANCELADA", "FALHOU"];
type StatusTransicaoAtendimento = (typeof STATUS_TRANSICAO_ATENDIMENTO)[number];
declare const ROTULOS_STATUS_AGENDAMENTO: Record<StatusAgendamento, string>;
declare function statusAgendamentoValido(status: unknown): status is StatusAgendamento;

declare const clientes: {
    id: number;
    imagemURL: string;
    nome: string;
    testemunho: string;
}[];

interface RepositorioProfissional {
    buscarTodos(): Promise<Profissional[]>;
}

declare class BuscarProfissionais implements CasoDeUso<void, Profissional[]> {
    private readonly repo;
    constructor(repo: RepositorioProfissional);
    executar(): Promise<Profissional[]>;
}

declare const profissionais: Profissional[];

interface RepositorioServico {
    buscarTodos(): Promise<Servico[]>;
}

declare class BuscarServicos implements CasoDeUso<void, Servico[]> {
    private readonly repo;
    constructor(repo: RepositorioServico);
    executar(): Promise<Servico[]>;
}

declare const servicos: Servico[];

declare const TEMPO_SLOT = 15;

interface RepositorioUsuario {
    salvar(usuario: Usuario): Promise<void>;
    buscarPorEmail(email: string): Promise<Usuario | null>;
}

interface ProvedorCriptografia {
    criptografar(senha: string): Promise<string>;
    comparar(senha: string, senhaCriptografada: string): Promise<boolean>;
}

declare class RegistrarUsuario implements CasoDeUso<Usuario, void> {
    private readonly repo;
    private readonly cripto;
    constructor(repo: RepositorioUsuario, cripto: ProvedorCriptografia);
    executar(usuario: Usuario): Promise<void>;
}

type Entrada = {
    email: string;
    senha: string;
};
declare class LoginUsuario implements CasoDeUso<Entrada, Usuario> {
    private readonly repo;
    private readonly cripto;
    constructor(repo: RepositorioUsuario, cripto: ProvedorCriptografia);
    executar(entrada: Entrada): Promise<Usuario>;
}

declare class AgendaUtils {
    private static readonly tempoSlot;
    private static minutos;
    static horariosDoDia(): {
        manha: string[];
        tardeNoite: string[];
    };
    static duracaoTotal(servicos: {
        qtdeSlots: number;
        duracaoMinutos?: number;
    }[]): string;
    static qtdeHorarios(servicos: {
        qtdeSlots: number;
        duracaoMinutos?: number;
    }[]): number;
    private static duracaoEmMinutos;
    static gerarHorarios(horas: number[]): string[];
}

declare class DateUtils {
    static hojeComHoraZerada(): Date;
    static proximosDias(qtde: number, incluirHoje?: boolean): Date[];
    static aplicarHorario(data: Date, horario: string): Date;
    static formatarData(data: Date, localizacao?: string): string;
    static formatarDataEHora(data: Date, localizacao?: string): string;
}

declare class MoedaUtils {
    static formatar(valor: number, locale?: string, moeda?: string): string;
}

type FinalidadeMidia = 'AVATAR' | 'SERVICO' | 'PROFISSIONAL' | 'CAPA';
type EntidadeMidia = 'USUARIO' | 'SERVICO' | 'PROFISSIONAL' | 'ESTABELECIMENTO';
interface VersaoMidia {
    url: string;
    largura: number;
    altura: number;
    bytes: number;
}
interface ImagemGaleria {
    id: string;
    titulo: string;
    finalidade: FinalidadeMidia;
    segmentoSlug: string | null;
    versoes: Record<string, VersaoMidia>;
}
interface AssociacaoMidia {
    midiaId: string | null;
    entidade: EntidadeMidia;
    entidadeId?: number;
}
interface ResultadoAssociacaoMidia {
    midiaId: string | null;
    entidade: EntidadeMidia;
    entidadeId: number;
    imagemURL: string | null;
}

interface IdentidadeEstabelecimento {
    imagemCapaURL?: string | null;
    tipoEstabelecimento?: string | null;
    segmentos?: Array<{
        slug?: string;
        principal?: boolean;
        segmento?: {
            slug?: string;
        };
    }>;
}
/** Sem heurística por nome: principal → tipo → único segmento reconhecido → neutro. */
declare function categoriaIdentidade(unidade?: IdentidadeEstabelecimento | null): string | null;
declare function capaPersonalizada(unidade?: IdentidadeEstabelecimento | null): string | null;
declare function iniciaisUsuario(nome: string): string;
declare function resolverURLMidia(url: string, api: string): string;

export { AgendaUtils, type Agendamento, type AssociacaoMidia, BuscarAgendaProfissionalPorDia, BuscarAgendamentosCliente, BuscarProfissionais, BuscarServicos, DateUtils, type EntidadeMidia, ExcluirAgendamento, type FinalidadeMidia, Horarios, type IdentidadeEstabelecimento, type ImagemGaleria, LoginUsuario, MoedaUtils, NovoAgendamento, ORIGENS_TRANSICAO_ATENDIMENTO, ObterHorariosOcupados, type OrigemTransicaoAtendimento, type Profissional, type ProvedorCriptografia, ROTULOS_STATUS_AGENDAMENTO, RegistrarUsuario, type RepositorioAgendamento, type RepositorioProfissional, type RepositorioServico, type RepositorioUsuario, type ResultadoAssociacaoMidia, STATUS_AGENDAMENTO, STATUS_TRANSICAO_ATENDIMENTO, type Servico, type StatusAgendamento, type StatusTransicaoAtendimento, TEMPO_SLOT, TIPOS_TRANSICAO_ATENDIMENTO, type TipoTransicaoAtendimento, type Usuario, type VersaoMidia, capaPersonalizada, categoriaIdentidade, clientes, iniciaisUsuario, profissionais, resolverURLMidia, servicos, statusAgendamentoValido };
