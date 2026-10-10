type PapelUsuario = 'SUPER_ADMIN' | 'APP_OWNER' | 'ESTABLISHMENT_OWNER' | 'ESTABLISHMENT_MEMBER' | 'CUSTOMER';
interface Usuario {
    id?: number;
    estabelecimentoId?: number;
    nome: string;
    email: string;
    senha?: string;
    telefone?: string;
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

export { AgendaUtils, type Agendamento, BuscarAgendaProfissionalPorDia, BuscarAgendamentosCliente, BuscarProfissionais, BuscarServicos, DateUtils, ExcluirAgendamento, Horarios, LoginUsuario, MoedaUtils, NovoAgendamento, ObterHorariosOcupados, type Profissional, type ProvedorCriptografia, RegistrarUsuario, type RepositorioAgendamento, type RepositorioProfissional, type RepositorioServico, type RepositorioUsuario, type Servico, TEMPO_SLOT, type Usuario, clientes, profissionais, servicos };
