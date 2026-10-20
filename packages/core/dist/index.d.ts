type PapelUsuario = 'SUPER_ADMIN' | 'APP_OWNER' | 'ESTABLISHMENT_OWNER' | 'ESTABLISHMENT_MEMBER' | 'CUSTOMER';
interface Usuario {
    id?: number;
    estabelecimentoId?: number;
    nome: string;
    email: string;
    senha?: string;
    trocarSenhaObrigatoria?: boolean;
    telefone?: string;
    fotoURL?: string | null;
    dataNascimento?: string | null;
    membroEstabelecimento?: boolean;
    papel?: PapelUsuario;
    role?: PapelUsuario;
}

type SexoProfissional = 'MASCULINO' | 'FEMININO' | 'NAO_INFORMADO';
interface Profissional {
    id: number;
    estabelecimentoId?: number;
    nome: string;
    sexo: SexoProfissional;
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

interface AtendimentoOperacional {
    id: number;
    status: string;
    data: string;
    dataFim?: string | null;
    valorTotal: number;
    iniciadoEm?: string | null;
    finalizadoEm?: string | null;
    controleManualEm?: string | null;
    controleManualPorId?: number | null;
    controleManualPor?: {
        id: number;
        nome: string;
    } | null;
    automacaoAtendimentoAtiva?: boolean;
    revisaoFluxo?: number;
    usuario?: {
        id?: number;
        nome: string;
    };
    profissional?: {
        id: number;
        nome: string;
    };
    servicos?: Array<{
        id: number;
        nome: string;
    }>;
    estabelecimento?: {
        fluxoAtendimentoAutomaticoAtivo: boolean;
        fusoHorario: string;
        inicioAtendimentoAutomaticoAtivo?: boolean;
        finalizacaoAtendimentoAutomaticaAtiva?: boolean;
    };
}
type AcaoAtendimento = StatusAgendamento | 'RETOMAR_AUTOMACAO';
declare const ROTULOS_ACOES: Partial<Record<AcaoAtendimento, string>>;
declare const rotuloStatus: (status: string) => string;
declare const atendimentoTerminal: (status: string) => boolean;
declare function acoesAtendimento(item: AtendimentoOperacional, agora: number): AcaoAtendimento[];
declare function comecaEmDezMinutos(item: AtendimentoOperacional, agora: number): boolean;
declare function dataAtendimento(item: AtendimentoOperacional): string;
declare function horarioAtendimento(valor: string, item: AtendimentoOperacional): string;
declare function intervaloDiaAtendimento(data: string, fusoHorario: string): {
    inicio: string;
    fim: string;
};

interface ConfiguracaoFluxoAtendimento {
    fluxoAtendimentoAutomaticoAtivo: boolean;
    inicioAtendimentoAutomaticoAtivo: boolean;
    finalizacaoAtendimentoAutomaticaAtiva: boolean;
    avisoAtendimentoAntecedenciaMinutos: number;
}
interface MonitoramentoAtendimento {
    geradoEm: string;
    workerHabilitado: boolean;
    periodoDesde: string;
    metricas: {
        automaticas: number;
        manuais: number;
        atrasos: number;
        tarefasAtrasadas: number;
        falhas: number;
        divergencias: number;
    };
    tarefas: Array<{
        id: number;
        agendamentoId: number;
        tipo: string;
        status: string;
        dataPrevista: string;
        tentativas: number;
        proximaTentativaEm: string | null;
    }>;
}
declare const OPCOES_FLUXO_ATENDIMENTO: readonly [{
    readonly campo: "fluxoAtendimentoAutomaticoAtivo";
    readonly titulo: "Fluxo automático de atendimento";
}, {
    readonly campo: "inicioAtendimentoAutomaticoAtivo";
    readonly titulo: "Iniciar automaticamente no horário";
}, {
    readonly campo: "finalizacaoAtendimentoAutomaticaAtiva";
    readonly titulo: "Finalizar automaticamente ao término";
}];
declare const METRICAS_FLUXO_ATENDIMENTO: readonly [{
    readonly campo: "automaticas";
    readonly titulo: "Transições automáticas (7 dias)";
}, {
    readonly campo: "manuais";
    readonly titulo: "Transições manuais (7 dias)";
}, {
    readonly campo: "atrasos";
    readonly titulo: "Atrasos registrados (7 dias)";
}, {
    readonly campo: "tarefasAtrasadas";
    readonly titulo: "Tarefas vencidas na fila";
}, {
    readonly campo: "falhas";
    readonly titulo: "Falhas pendentes";
}, {
    readonly campo: "divergencias";
    readonly titulo: "Finalizados sem receita (7 dias)";
}];

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

type FinalidadeMidia = 'AVATAR' | 'SERVICO' | 'PROFISSIONAL' | 'CAPA' | 'LOGO';
type ModoLogoEstabelecimento = 'PADRAO' | 'PERSONALIZADO' | 'OCULTO';
interface ConfiguracaoLogoEstabelecimento {
    logoModo: ModoLogoEstabelecimento;
    logoURL: string | null;
}
declare const OPCOES_LOGO_ESTABELECIMENTO: Array<{
    modo: ModoLogoEstabelecimento;
    titulo: string;
}>;
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
    logoURL?: string | null;
    logoModo?: 'PADRAO' | 'PERSONALIZADO' | 'OCULTO';
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

declare const CHAVES_FOTOS_PROFISSIONAIS_LEGADAS: string[];
/** Caminhos das fotos demonstrativas aposentadas; não identifica pessoas pelo nome. */
declare function imagemProfissionalLegada(url?: string | null): boolean;
declare function imagemPadraoProfissional(sexo?: string | null): string;
declare function urlImagemProfissional(url?: string | null, sexo?: string | null): string;

/** Contrato de apresentação compartilhado por web e React Native. Sem dependência de UI. */
type DadosRelacionamento = Record<string, unknown>;
type SecaoRelacionamento = 'clientes' | 'templates' | 'campanhas' | 'fidelidade' | 'envios' | 'metricas';
interface CampoRelacionamento {
    chave: string;
    titulo: string;
    tipo?: 'numero' | 'booleano' | 'texto' | 'longo' | 'data' | 'lista' | 'niveis';
    opcoes?: Array<{
        valor: string;
        titulo: string;
    }>;
    padrao?: string;
    opcional?: boolean;
    oculto?: boolean;
}
interface FormularioRelacionamento {
    titulo: string;
    caminho: string;
    metodo: 'GET' | 'POST' | 'PUT';
    campos: CampoRelacionamento[];
    aviso?: string;
    confirmar?: string;
}
interface AcaoRelacionamento {
    titulo: string;
    caminho: string;
    confirmar?: string;
    formulario?: FormularioRelacionamento;
}
interface APIClienteRelacionamento {
    get: (caminho: string) => Promise<unknown>;
    post: (caminho: string, dados: unknown) => Promise<unknown>;
    put: (caminho: string, dados: unknown) => Promise<unknown>;
}
declare const secoesRelacionamento: Array<{
    id: SecaoRelacionamento;
    titulo: string;
}>;
declare const canaisRelacionamento: string[];
declare function objetoRelacionamento(valor: unknown): DadosRelacionamento;
declare function registrosRelacionamento(valor: unknown): DadosRelacionamento[];
declare function valorRelacionamento(dados: DadosRelacionamento, caminho: string): unknown;
declare const camposProgramaRelacionamento: CampoRelacionamento[];
declare function formulariosRelacionamento(secao: SecaoRelacionamento, clientes: DadosRelacionamento[], templates: DadosRelacionamento[]): FormularioRelacionamento[];
declare function formulariosBeneficioRelacionamento(): FormularioRelacionamento[];
declare function formularioSupressaoRelacionamento(clienteId: number): FormularioRelacionamento;
declare function formularioClienteRelacionamento(cliente: DadosRelacionamento): FormularioRelacionamento;
declare function formularioPreferenciaRelacionamento(clienteId: number, canal: string): FormularioRelacionamento;
declare function acoesRegistroRelacionamento(secao: SecaoRelacionamento, registro: DadosRelacionamento): AcaoRelacionamento[];
/** Valores locais de formulário viram instantes ISO; a API continua sendo autoridade das regras. */
declare function prepararFormularioRelacionamento(form: FormularioRelacionamento, valores: Record<string, string>, canal?: string): DadosRelacionamento;
declare function instanteLocalRelacionamento(texto: string): string;
declare function valoresFormularioRelacionamento(form: FormularioRelacionamento, registro?: DadosRelacionamento): Record<string, string>;

interface EstadoCentralRelacionamento {
    grupoFidelidade: 'recompensas' | 'cupons' | 'indicacoes';
    secao: SecaoRelacionamento;
    permissoes: string[];
    carregando: boolean;
    salvando: boolean;
    erro: string;
    mensagem: string;
    itens: DadosRelacionamento[];
    total: number;
    pagina: number;
    busca: string;
    inicio: string;
    fim: string;
    clientes: DadosRelacionamento[];
    templates: DadosRelacionamento[];
    programa: DadosRelacionamento;
    selecionado: DadosRelacionamento | null;
    detalhe: DadosRelacionamento | null;
    paginaDetalhe: number;
    totalDetalhe: number;
}
/** Estado por sessão/tenant, não persistido. Uma resposta antiga nunca substitui uma consulta mais recente. */
declare class CentralRelacionamentoStore {
    private api;
    private ouvintes;
    private revisao;
    private ativo;
    private estado;
    constructor(api: APIClienteRelacionamento);
    snapshot: () => EstadoCentralRelacionamento;
    subscribe: (ouvinte: () => void) => () => void;
    private atualizar;
    encerrar: () => void;
    iniciar(): Promise<void>;
    recarregar(): Promise<void>;
    carregar(alteracoes?: Partial<Pick<EstadoCentralRelacionamento, 'grupoFidelidade' | 'secao' | 'pagina' | 'busca' | 'inicio' | 'fim'>>): Promise<void>;
    selecionar(item: DadosRelacionamento | null, pagina?: number): Promise<void>;
    salvar(form: FormularioRelacionamento, valores: Record<string, string>, canal?: string): Promise<boolean>;
}
declare function limitePaginaRelacionamento(estado: EstadoCentralRelacionamento): 25 | 50;

declare function tituloRegistroRelacionamento(item: DadosRelacionamento): string;
declare function rotuloRelacionamento(chave: string): string;
/** Sem JSON bruto: conserva estrutura de leitura e oculta dados técnicos/tokens do transporte. */
declare function linhasRelacionamento(dados: unknown, prefixo?: string, profundidade?: number): Array<{
    titulo: string;
    valor: string;
}>;

type StatusTourMapa = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'PULADO';
type PosicaoPassoTour = 'ACIMA' | 'ABAIXO' | 'AUTOMATICA';
interface EstadoTourMapa {
    versao: number;
    status: StatusTourMapa;
    passoAtual: number;
    atualizadoEm: string;
}
interface PassoTour {
    id: string;
    alvo: string;
    titulo: string;
    descricao: string;
    posicao: PosicaoPassoTour;
    indisponivel: 'EXPLICAR' | 'PULAR';
    interacao?: 'SELECIONAR_MARCADOR';
}
interface DefinicaoTour {
    id: string;
    versao: number;
    chavePersistencia: string;
    /** Só deve mudar mediante decisão explícita de produto. */
    reiniciarAutomaticamenteNovaVersao: boolean;
    passos: readonly PassoTour[];
}
interface PersistenciaTour {
    ler(chave: string): Promise<string | null>;
    salvar(chave: string, valor: string): Promise<void>;
}
/** Não admite coordenadas, textos pesquisados ou identidade do cliente/unidade. */
interface EventoTour {
    tourId: string;
    versao: number;
    passoId: string;
    tipo: 'INICIO' | 'AVANCO' | 'RETORNO' | 'CONCLUSAO' | 'ABANDONO' | 'REINICIO';
}
declare function novoEstadoTour(versao: number, agora: string): EstadoTourMapa;
declare function lerEstadoTour(texto: string): EstadoTourMapa | null;
declare const TOUR_MAPA: DefinicaoTour;

interface SnapshotTour {
    estado: EstadoTourMapa;
    carregando: boolean;
    aberto: boolean;
    erro: string;
}
declare class ControladorTour {
    readonly definicao: DefinicaoTour;
    private persistencia;
    private agora;
    private emitir?;
    private disponivel;
    private snapshot;
    private ouvintes;
    private fila;
    private hidratacao;
    private leituraSegura;
    constructor(definicao: DefinicaoTour, persistencia: PersistenciaTour, agora?: () => string, emitir?: (evento: EventoTour) => void, disponivel?: (_alvo: string) => boolean);
    obterSnapshot: () => SnapshotTour;
    observar: (ouvinte: () => void) => () => void;
    private atualizar;
    carregar: () => Promise<void>;
    private hidratar;
    iniciar: (automatico?: boolean) => boolean;
    avancar: () => void;
    voltar: () => void;
    pular: () => void;
    concluir: () => void;
    reiniciar: () => boolean;
    /** Fechar a tela pausa a apresentação sem marcar conclusão ou apagar progresso. */
    suspender: () => void;
    aguardarPersistencia: () => Promise<void>;
    private mover;
    private salvar;
}

export { type APIClienteRelacionamento, type AcaoAtendimento, type AcaoRelacionamento, AgendaUtils, type Agendamento, type AssociacaoMidia, type AtendimentoOperacional, BuscarAgendaProfissionalPorDia, BuscarAgendamentosCliente, BuscarProfissionais, BuscarServicos, CHAVES_FOTOS_PROFISSIONAIS_LEGADAS, type CampoRelacionamento, CentralRelacionamentoStore, type ConfiguracaoFluxoAtendimento, type ConfiguracaoLogoEstabelecimento, ControladorTour, type DadosRelacionamento, DateUtils, type DefinicaoTour, type EntidadeMidia, type EstadoCentralRelacionamento, type EstadoTourMapa, type EventoTour, ExcluirAgendamento, type FinalidadeMidia, type FormularioRelacionamento, Horarios, type IdentidadeEstabelecimento, type ImagemGaleria, LoginUsuario, METRICAS_FLUXO_ATENDIMENTO, type ModoLogoEstabelecimento, MoedaUtils, type MonitoramentoAtendimento, NovoAgendamento, OPCOES_FLUXO_ATENDIMENTO, OPCOES_LOGO_ESTABELECIMENTO, ORIGENS_TRANSICAO_ATENDIMENTO, ObterHorariosOcupados, type OrigemTransicaoAtendimento, type PassoTour, type PersistenciaTour, type PosicaoPassoTour, type Profissional, type ProvedorCriptografia, ROTULOS_ACOES, ROTULOS_STATUS_AGENDAMENTO, RegistrarUsuario, type RepositorioAgendamento, type RepositorioProfissional, type RepositorioServico, type RepositorioUsuario, type ResultadoAssociacaoMidia, STATUS_AGENDAMENTO, STATUS_TRANSICAO_ATENDIMENTO, type SecaoRelacionamento, type Servico, type SexoProfissional, type SnapshotTour, type StatusAgendamento, type StatusTourMapa, type StatusTransicaoAtendimento, TEMPO_SLOT, TIPOS_TRANSICAO_ATENDIMENTO, TOUR_MAPA, type TipoTransicaoAtendimento, type Usuario, type VersaoMidia, acoesAtendimento, acoesRegistroRelacionamento, atendimentoTerminal, camposProgramaRelacionamento, canaisRelacionamento, capaPersonalizada, categoriaIdentidade, clientes, comecaEmDezMinutos, dataAtendimento, formularioClienteRelacionamento, formularioPreferenciaRelacionamento, formularioSupressaoRelacionamento, formulariosBeneficioRelacionamento, formulariosRelacionamento, horarioAtendimento, imagemPadraoProfissional, imagemProfissionalLegada, iniciaisUsuario, instanteLocalRelacionamento, intervaloDiaAtendimento, lerEstadoTour, limitePaginaRelacionamento, linhasRelacionamento, novoEstadoTour, objetoRelacionamento, prepararFormularioRelacionamento, profissionais, registrosRelacionamento, resolverURLMidia, rotuloRelacionamento, rotuloStatus, secoesRelacionamento, servicos, statusAgendamentoValido, tituloRegistroRelacionamento, urlImagemProfissional, valorRelacionamento, valoresFormularioRelacionamento };
