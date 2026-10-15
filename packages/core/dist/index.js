"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  AgendaUtils: () => AgendaUtils,
  BuscarAgendaProfissionalPorDia: () => BuscarAgendaProfissionalPorDia,
  BuscarAgendamentosCliente: () => BuscarAgendamentosCliente,
  BuscarProfissionais: () => BuscarProfissionais,
  BuscarServicos: () => BuscarServicos,
  CHAVES_FOTOS_PROFISSIONAIS_LEGADAS: () => CHAVES_FOTOS_PROFISSIONAIS_LEGADAS,
  CentralRelacionamentoStore: () => CentralRelacionamentoStore,
  DateUtils: () => DateUtils,
  ExcluirAgendamento: () => ExcluirAgendamento,
  Horarios: () => Horarios,
  LoginUsuario: () => LoginUsuario,
  METRICAS_FLUXO_ATENDIMENTO: () => METRICAS_FLUXO_ATENDIMENTO,
  MoedaUtils: () => MoedaUtils,
  NovoAgendamento: () => NovoAgendamento,
  OPCOES_FLUXO_ATENDIMENTO: () => OPCOES_FLUXO_ATENDIMENTO,
  OPCOES_LOGO_ESTABELECIMENTO: () => OPCOES_LOGO_ESTABELECIMENTO,
  ORIGENS_TRANSICAO_ATENDIMENTO: () => ORIGENS_TRANSICAO_ATENDIMENTO,
  ObterHorariosOcupados: () => ObterHorariosOcupados,
  ROTULOS_ACOES: () => ROTULOS_ACOES,
  ROTULOS_STATUS_AGENDAMENTO: () => ROTULOS_STATUS_AGENDAMENTO,
  RegistrarUsuario: () => RegistrarUsuario,
  STATUS_AGENDAMENTO: () => STATUS_AGENDAMENTO,
  STATUS_TRANSICAO_ATENDIMENTO: () => STATUS_TRANSICAO_ATENDIMENTO,
  TEMPO_SLOT: () => TEMPO_SLOT,
  TIPOS_TRANSICAO_ATENDIMENTO: () => TIPOS_TRANSICAO_ATENDIMENTO,
  acoesAtendimento: () => acoesAtendimento,
  acoesRegistroRelacionamento: () => acoesRegistroRelacionamento,
  atendimentoTerminal: () => atendimentoTerminal,
  camposProgramaRelacionamento: () => camposProgramaRelacionamento,
  canaisRelacionamento: () => canaisRelacionamento,
  capaPersonalizada: () => capaPersonalizada,
  categoriaIdentidade: () => categoriaIdentidade,
  clientes: () => clientes_default,
  comecaEmDezMinutos: () => comecaEmDezMinutos,
  dataAtendimento: () => dataAtendimento,
  formularioClienteRelacionamento: () => formularioClienteRelacionamento,
  formularioPreferenciaRelacionamento: () => formularioPreferenciaRelacionamento,
  formularioSupressaoRelacionamento: () => formularioSupressaoRelacionamento,
  formulariosBeneficioRelacionamento: () => formulariosBeneficioRelacionamento,
  formulariosRelacionamento: () => formulariosRelacionamento,
  horarioAtendimento: () => horarioAtendimento,
  imagemPadraoProfissional: () => imagemPadraoProfissional,
  imagemProfissionalLegada: () => imagemProfissionalLegada,
  iniciaisUsuario: () => iniciaisUsuario,
  instanteLocalRelacionamento: () => instanteLocalRelacionamento,
  intervaloDiaAtendimento: () => intervaloDiaAtendimento,
  limitePaginaRelacionamento: () => limitePaginaRelacionamento,
  linhasRelacionamento: () => linhasRelacionamento,
  objetoRelacionamento: () => objetoRelacionamento,
  prepararFormularioRelacionamento: () => prepararFormularioRelacionamento,
  profissionais: () => profissionais_default,
  registrosRelacionamento: () => registrosRelacionamento,
  resolverURLMidia: () => resolverURLMidia,
  rotuloRelacionamento: () => rotuloRelacionamento,
  rotuloStatus: () => rotuloStatus,
  secoesRelacionamento: () => secoesRelacionamento,
  servicos: () => servicos_default,
  statusAgendamentoValido: () => statusAgendamentoValido,
  tituloRegistroRelacionamento: () => tituloRegistroRelacionamento,
  urlImagemProfissional: () => urlImagemProfissional,
  valorRelacionamento: () => valorRelacionamento,
  valoresFormularioRelacionamento: () => valoresFormularioRelacionamento
});
module.exports = __toCommonJS(src_exports);

// src/agendamento/service/BuscarAgendamentosCliente.ts
var BuscarAgendamentosCliente = class {
  constructor(repo) {
    this.repo = repo;
  }
  async executar(usuario) {
    const agendamentos = this.repo.buscarPorEmail(usuario.email);
    return agendamentos;
  }
};

// src/agendamento/service/BuscarAgendaProfissionalPorDia.ts
var BuscarAgendaProfissionalPorDia = class {
  constructor(repo) {
    this.repo = repo;
  }
  executar(entrada) {
    const { profissional, data } = entrada;
    return this.repo.buscarPorProfissionalEData(profissional, data);
  }
};

// src/agendamento/service/ExcluirAgendamento.ts
var ExcluirAgendamento = class {
  constructor(repo) {
    this.repo = repo;
  }
  async executar(entrada) {
    const { usuario, id } = entrada;
    const agendamento = await this.repo.buscarPorId(id);
    if (!agendamento) {
      throw new Error("Agendamento n\xE3o encontrado");
    }
    const cliente = agendamento.usuario.email === usuario.email;
    const mesmaEstabelecimento = agendamento.estabelecimentoId === usuario.estabelecimentoId;
    const profissional = usuario.membroEstabelecimento && mesmaEstabelecimento;
    if (!cliente && !profissional) {
      throw new Error("Usu\xE1rio n\xE3o autorizado");
    }
    await this.repo.excluir(id);
  }
};

// src/constants/clientes.ts
var clientes = [
  {
    id: 1,
    imagemURL: "/clientes/cliente-1.jpg",
    nome: "Ricardo Santos",
    testemunho: "Consegui encontrar um estabelecimento perto de casa, comparar hor\xE1rios dispon\xEDveis e agendar em poucos minutos. O atendimento foi pontual e bem organizado."
  },
  {
    id: 2,
    imagemURL: "/clientes/cliente-2.jpg",
    nome: "Tiago Oliveira",
    testemunho: "Gostei de ver os servi\xE7os, pre\xE7os e profissionais antes de marcar. Ficou mais f\xE1cil escolher o estabelecimento certo para o que eu precisava."
  },
  {
    id: 3,
    imagemURL: "/clientes/cliente-3.jpg",
    nome: "Patr\xEDcia",
    testemunho: "A experi\xEAncia foi simples do in\xEDcio ao fim. Escolhi o hor\xE1rio pelo celular, recebi a confirma\xE7\xE3o e acompanhei tudo na minha \xE1rea de cliente."
  },
  {
    id: 4,
    imagemURL: "/clientes/cliente-4.jpg",
    nome: "Sr. Carlos",
    testemunho: "Uso para manter meus hor\xE1rios em dia. A plataforma ajuda a encontrar profissionais pr\xF3ximos e evita liga\xE7\xF5es para confirmar disponibilidade."
  }
];
var clientes_default = clientes;

// src/constants/profissionais.ts
var profissionais = [
  {
    id: 1,
    nome: "Marcos Almeida",
    sexo: "MASCULINO",
    descricao: "Especialista em cortes masculinos cl\xE1ssicos, acabamento com m\xE1quina e atendimento consultivo.",
    imagemURL: "/profissionais/avatar-masculino.png",
    avaliacao: 5,
    quantidadeAvaliacoes: 87
  },
  {
    id: 2,
    nome: "Roberto Lima",
    sexo: "MASCULINO",
    descricao: "Profissional focado em barba, desenho, aparo e finaliza\xE7\xE3o para diferentes estilos.",
    imagemURL: "/profissionais/avatar-masculino.png",
    avaliacao: 4.5,
    quantidadeAvaliacoes: 39
  },
  {
    id: 3,
    nome: "Kathya Martins",
    sexo: "FEMININO",
    descricao: "Atendimento preciso em cortes modernos, visagismo e finaliza\xE7\xF5es personalizadas.",
    imagemURL: "/profissionais/avatar-feminino.png",
    avaliacao: 5,
    quantidadeAvaliacoes: 91
  },
  {
    id: 4,
    nome: "S\xE9rgio Rocha",
    sexo: "MASCULINO",
    descricao: "Experi\xEAncia em cortes degrad\xEA, barba alinhada e acabamento detalhado.",
    imagemURL: "/profissionais/avatar-masculino.png",
    avaliacao: 4.5,
    quantidadeAvaliacoes: 29
  },
  {
    id: 5,
    nome: "Rafael Souza",
    sexo: "MASCULINO",
    descricao: "Especialista em m\xE1quina, cortes baixos e manuten\xE7\xE3o r\xE1pida com acabamento limpo.",
    imagemURL: "/profissionais/avatar-masculino.png",
    avaliacao: 4.5,
    quantidadeAvaliacoes: 44
  },
  {
    id: 6,
    nome: "Fernanda Costa",
    sexo: "FEMININO",
    descricao: "Profissional com foco em atendimento personalizado, cortes vers\xE1teis e finaliza\xE7\xE3o cuidadosa.",
    imagemURL: "/profissionais/avatar-feminino.png",
    avaliacao: 5,
    quantidadeAvaliacoes: 46
  }
];
var profissionais_default = profissionais;

// src/constants/servicos.ts
var servicos = [
  {
    id: 1,
    nome: "Corte Social",
    descricao: "Corte masculino alinhado, com acabamento preciso e pensado para o dia a dia.",
    preco: 55,
    qtdeSlots: 3,
    imagemURL: "/servicos/corte-de-cabelo.jpg"
  },
  {
    id: 2,
    nome: "Barba Completa",
    descricao: "Aparo, desenho e finaliza\xE7\xE3o da barba para manter o visual bem cuidado.",
    preco: 45,
    qtdeSlots: 2,
    imagemURL: "/servicos/corte-de-barba.jpg"
  },
  {
    id: 3,
    nome: "Manicure e Pedicure",
    descricao: "Cuidado completo para m\xE3os e p\xE9s, com higiene, conforto e acabamento profissional.",
    preco: 40,
    qtdeSlots: 2,
    imagemURL: "/servicos/manicure-pedicure.jpg"
  },
  {
    id: 4,
    nome: "Combo Corte e Barba",
    descricao: "Corte e barba no mesmo atendimento para quem busca praticidade e resultado completo.",
    preco: 95,
    qtdeSlots: 2,
    imagemURL: "/servicos/combo.jpg"
  },
  {
    id: 5,
    nome: "Corte Infantil",
    descricao: "Atendimento infantil com cuidado, paci\xEAncia e um corte adequado para cada idade.",
    preco: 60,
    qtdeSlots: 2,
    imagemURL: "/servicos/corte-infantil.jpg"
  },
  {
    id: 6,
    nome: "Dia do Noivo",
    descricao: "Pacote especial para prepara\xE7\xE3o do noivo, com corte, barba e cuidados de apresenta\xE7\xE3o.",
    preco: 189,
    qtdeSlots: 5,
    imagemURL: "/servicos/dia-de-noivo.jpg"
  }
];
var servicos_default = servicos;

// src/constants/index.ts
var TEMPO_SLOT = 15;

// src/utils/AgendaUtils.ts
var AgendaUtils = class {
  static horariosDoDia() {
    return {
      manha: this.gerarHorarios([8, 9, 10, 11]),
      tardeNoite: this.gerarHorarios([12, 13, 14, 15, 16, 17, 18, 19, 20])
    };
  }
  static duracaoTotal(servicos2) {
    const duracao = this.duracaoEmMinutos(servicos2);
    const horas = Math.floor(duracao / 60);
    const minutos = duracao % 60;
    return `${horas}h ${minutos.toString().padStart(2, "0")}m`;
  }
  static qtdeHorarios(servicos2) {
    return Math.ceil(this.duracaoEmMinutos(servicos2) / this.tempoSlot);
  }
  static duracaoEmMinutos(servicos2) {
    return servicos2.reduce((total, servico) => {
      const duracao = Number(servico.duracaoMinutos);
      return total + (duracao > 0 ? duracao : servico.qtdeSlots * this.tempoSlot);
    }, 0);
  }
  static gerarHorarios(horas) {
    return horas.reduce((horarios, hora) => {
      const horariosDaHora = this.minutos.map((minuto) => {
        const horaFormatada = hora.toString().padStart(2, "0");
        const minutoFormatado = minuto.toString().padStart(2, "0");
        return `${horaFormatada}:${minutoFormatado}`;
      });
      return [...horarios, ...horariosDaHora];
    }, []);
  }
};
AgendaUtils.tempoSlot = 15;
AgendaUtils.minutos = [0, 15, 30, 45];

// src/utils/DateUtils.ts
var DateUtils = class _DateUtils {
  static hojeComHoraZerada() {
    const hoje = /* @__PURE__ */ new Date();
    hoje.setHours(0, 0, 0, 0);
    return hoje;
  }
  static proximosDias(qtde, incluirHoje = true) {
    const dias = [];
    const hoje = _DateUtils.hojeComHoraZerada();
    if (incluirHoje) {
      dias.push(hoje);
    }
    for (let i = 1; dias.length < qtde; i++) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() + i);
      dias.push(dia);
    }
    return dias;
  }
  static aplicarHorario(data, horario) {
    const novaData = new Date(data);
    const [hora, minuto] = horario.split(":").map(Number);
    novaData.setHours(hora, minuto, 0, 0);
    return novaData;
  }
  static formatarData(data, localizacao = "pt-BR") {
    return data.toLocaleDateString(localizacao, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
  static formatarDataEHora(data, localizacao = "pt-BR") {
    return data.toLocaleDateString(localizacao, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric"
    });
  }
};

// src/utils/MoedaUtils.ts
var MoedaUtils = class {
  static formatar(valor, locale = "pt-BR", moeda = "BRL") {
    return Intl.NumberFormat(locale, {
      style: "currency",
      currency: moeda,
      minimumFractionDigits: 2
    }).format(valor);
  }
};

// src/agendamento/model/Horarios.ts
var Horarios = class {
  constructor(inicio, qtde, horariosOcupados, horariosDisponiveis) {
    this.inicio = inicio;
    this.qtde = qtde;
    this.horariosOcupados = horariosOcupados;
    this.horariosDisponiveis = horariosDisponiveis;
  }
  get todos() {
    if (this.horariosDisponiveis) {
      return this.horariosConsecutivos(this.horariosDisponiveis);
    }
    const { manha, tardeNoite } = AgendaUtils.horariosDoDia();
    const horarios = [...manha, ...tardeNoite];
    return this.horariosConsecutivos(horarios);
  }
  get completo() {
    return this.todos.length === this.qtde;
  }
  get incompleto() {
    return !this.completo;
  }
  get ocupado() {
    return this.todos.some((h) => this.horariosOcupados.includes(h));
  }
  horariosConsecutivos(horariosDisponiveis) {
    if (typeof this.inicio !== "string") return [];
    const [hora, minuto] = this.inicio.split(":").map(Number);
    if (!Number.isInteger(hora) || !Number.isInteger(minuto)) return [];
    const inicioEmMinutos = hora * 60 + minuto;
    const horarios = [];
    for (let indice = 0; indice < this.qtde; indice++) {
      const totalMinutos = inicioEmMinutos + indice * TEMPO_SLOT;
      const horario = `${Math.floor(totalMinutos / 60).toString().padStart(2, "0")}:${(totalMinutos % 60).toString().padStart(2, "0")}`;
      if (!horariosDisponiveis.includes(horario)) break;
      horarios.push(horario);
    }
    return horarios;
  }
};

// src/agendamento/service/NovoAgendamento.ts
var NovoAgendamento = class {
  constructor(repo) {
    this.repo = repo;
  }
  async executar(entrada) {
    const { usuario, agendamento } = entrada;
    if (usuario.id !== agendamento.usuario.id) {
      throw new Error("N\xE3o \xE9 poss\xEDvel criar um agendamento para outro usu\xE1rio.");
    }
    await this.repo.criar(agendamento);
  }
};

// src/agendamento/service/ObterHorariosOcupados.ts
var ObterHorariosOcupados = class {
  constructor(repo) {
    this.repo = repo;
  }
  async executar(entrada) {
    const { profissionalId, data } = entrada;
    const agendamentos = await this.repo.buscarPorProfissionalEData(profissionalId, data);
    const dados = agendamentos.map((agendamento) => {
      return {
        data: agendamento.data,
        slots: agendamento.servicos.reduce((total, s) => total + s.qtdeSlots, 0)
      };
    }).reduce((horariosOcupados, dados2) => {
      const horario = dados2.data;
      const slots = dados2.slots;
      const horarios = Array.from(
        { length: slots },
        (_, i) => this.somarMinutos(horario, i * TEMPO_SLOT)
      );
      return [...horariosOcupados, ...horarios];
    }, []).map((d) => d.toTimeString().slice(0, 5));
    return dados;
  }
  somarMinutos(data, minutos) {
    return new Date(data.getTime() + minutos * 6e4);
  }
};

// src/agendamento/status-atendimento.ts
var STATUS_AGENDAMENTO = [
  "AGENDADO",
  "CONFIRMADO",
  "ATRASADO",
  "CHECKIN",
  "CONCLUIDO",
  "CANCELADO",
  "NO_SHOW"
];
var ORIGENS_TRANSICAO_ATENDIMENTO = ["MANUAL", "AUTOMATICA"];
var TIPOS_TRANSICAO_ATENDIMENTO = ["AVISO", "INICIAR", "FINALIZAR"];
var STATUS_TRANSICAO_ATENDIMENTO = [
  "AGENDADA",
  "PROCESSANDO",
  "PROCESSADA",
  "CANCELADA",
  "FALHOU"
];
var ROTULOS_STATUS_AGENDAMENTO = {
  AGENDADO: "Agendado",
  CONFIRMADO: "Confirmado",
  ATRASADO: "Em atraso",
  CHECKIN: "Em atendimento",
  CONCLUIDO: "Finalizado",
  CANCELADO: "Cancelado",
  NO_SHOW: "N\xE3o compareceu"
};
function statusAgendamentoValido(status) {
  return typeof status === "string" && STATUS_AGENDAMENTO.includes(status);
}

// src/agendamento/operacao-atendimento.ts
var ROTULOS_ACOES = {
  CONFIRMADO: "Confirmar",
  ATRASADO: "Marcar atraso",
  CHECKIN: "Iniciar atendimento",
  CONCLUIDO: "Finalizar",
  CANCELADO: "Cancelar",
  NO_SHOW: "Registrar aus\xEAncia",
  RETOMAR_AUTOMACAO: "Retomar automa\xE7\xE3o"
};
var rotuloStatus = (status) => statusAgendamentoValido(status) ? ROTULOS_STATUS_AGENDAMENTO[status] : status;
var atendimentoTerminal = (status) => ["CONCLUIDO", "CANCELADO", "NO_SHOW"].includes(status);
function acoesAtendimento(item, agora) {
  if (!statusAgendamentoValido(item.status)) return [];
  const acoes = [];
  if (item.status === "AGENDADO") acoes.push("CONFIRMADO");
  if (["AGENDADO", "CONFIRMADO", "CHECKIN"].includes(item.status)) acoes.push("ATRASADO");
  if (["AGENDADO", "CONFIRMADO", "ATRASADO"].includes(item.status)) acoes.push("CHECKIN");
  if (["ATRASADO", "CHECKIN"].includes(item.status)) acoes.push("CONCLUIDO");
  if (!atendimentoTerminal(item.status)) {
    if (new Date(item.data).getTime() <= agora) acoes.push("NO_SHOW");
    acoes.push("CANCELADO");
    if (item.estabelecimento?.fluxoAtendimentoAutomaticoAtivo && (item.controleManualEm || !item.automacaoAtendimentoAtiva || item.status === "ATRASADO")) acoes.push("RETOMAR_AUTOMACAO");
  }
  return acoes;
}
function comecaEmDezMinutos(item, agora) {
  const faltam = new Date(item.data).getTime() - agora;
  return ["AGENDADO", "CONFIRMADO", "ATRASADO"].includes(item.status) && faltam >= 0 && faltam <= 6e5;
}
function dataAtendimento(item) {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: item.estabelecimento?.fusoHorario ?? "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(item.data));
  const parte = (tipo) => partes.find((p) => p.type === tipo)?.value;
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}
function horarioAtendimento(valor, item) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: item.estabelecimento?.fusoHorario ?? "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(valor));
}
function intervaloDiaAtendimento(data, fusoHorario) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const converter = (diaUTC) => {
    const alvo = Date.UTC(ano, mes - 1, diaUTC);
    let instante = alvo;
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const partes = new Intl.DateTimeFormat("en-US", { timeZone: fusoHorario, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instante));
      const valor = (tipo) => Number(partes.find((p) => p.type === tipo)?.value);
      const local = Date.UTC(valor("year"), valor("month") - 1, valor("day"), valor("hour"), valor("minute"), valor("second"));
      const diferenca = alvo - local;
      instante += diferenca;
      if (!diferenca) break;
    }
    return new Date(instante).toISOString();
  };
  return { inicio: converter(dia), fim: converter(dia + 1) };
}

// src/agendamento/monitoramento-atendimento.ts
var OPCOES_FLUXO_ATENDIMENTO = [
  { campo: "fluxoAtendimentoAutomaticoAtivo", titulo: "Fluxo autom\xE1tico de atendimento" },
  { campo: "inicioAtendimentoAutomaticoAtivo", titulo: "Iniciar automaticamente no hor\xE1rio" },
  { campo: "finalizacaoAtendimentoAutomaticaAtiva", titulo: "Finalizar automaticamente ao t\xE9rmino" }
];
var METRICAS_FLUXO_ATENDIMENTO = [
  { campo: "automaticas", titulo: "Transi\xE7\xF5es autom\xE1ticas (7 dias)" },
  { campo: "manuais", titulo: "Transi\xE7\xF5es manuais (7 dias)" },
  { campo: "atrasos", titulo: "Atrasos registrados (7 dias)" },
  { campo: "tarefasAtrasadas", titulo: "Tarefas vencidas na fila" },
  { campo: "falhas", titulo: "Falhas pendentes" },
  { campo: "divergencias", titulo: "Finalizados sem receita (7 dias)" }
];

// src/profissional/service/BuscarProfissionais.ts
var BuscarProfissionais = class {
  constructor(repo) {
    this.repo = repo;
  }
  async executar() {
    return this.repo.buscarTodos();
  }
};

// src/servico/service/BuscarServicos.ts
var BuscarServicos = class {
  constructor(repo) {
    this.repo = repo;
  }
  async executar() {
    return this.repo.buscarTodos();
  }
};

// src/usuario/service/RegistrarUsuario.ts
var RegistrarUsuario = class {
  constructor(repo, cripto) {
    this.repo = repo;
    this.cripto = cripto;
  }
  async executar(usuario) {
    const usuarioExistente = await this.repo.buscarPorEmail(usuario.email);
    if (usuarioExistente) {
      throw new Error("Usu\xE1rio j\xE1 existe");
    }
    const senhaCriptografada = await this.cripto.criptografar(usuario.senha);
    const novoUsuario = {
      ...usuario,
      senha: senhaCriptografada,
      membroEstabelecimento: false
    };
    await this.repo.salvar(novoUsuario);
  }
};

// src/usuario/service/LoginUsuario.ts
var LoginUsuario = class {
  constructor(repo, cripto) {
    this.repo = repo;
    this.cripto = cripto;
  }
  async executar(entrada) {
    const { email, senha } = entrada;
    const usuario = await this.repo.buscarPorEmail(email);
    if (!usuario) throw new Error("Usu\xE1rio n\xE3o encontrado");
    const mesmaSenha = await this.cripto.comparar(senha, usuario.senha);
    if (!mesmaSenha) throw new Error("Senha incorreta");
    delete usuario.senha;
    return usuario;
  }
};

// src/midia/index.ts
var OPCOES_LOGO_ESTABELECIMENTO = [
  { modo: "PADRAO", titulo: "Logo UniFlow ABS" },
  { modo: "PERSONALIZADO", titulo: "Logo do estabelecimento" },
  { modo: "OCULTO", titulo: "N\xE3o exibir logo" }
];

// src/midia/identidade.ts
var tipos = {
  BARBEARIA: "barbearia",
  SALAO_BELEZA: "salao-cabelo",
  CLINICA_ESTETICA: "clinica-estetica",
  ESTUDIO_BELEZA: "estetica-beleza",
  ESMALTERIA: "manicure-pedicure",
  SPA_BEM_ESTAR: "spa-bem-estar"
};
var segmentos = {
  barbearia: "barbearia",
  "salao-beleza": "salao-cabelo",
  "manicure-pedicure": "manicure-pedicure",
  "clinica-estetica": "clinica-estetica",
  beleza: "estetica-beleza",
  "spa-bem-estar": "spa-bem-estar"
};
function categoriaIdentidade(unidade) {
  if (!unidade) return null;
  const principal = unidade.segmentos?.find((s) => s.principal);
  if (principal) return segmentos[principal.slug ?? principal.segmento?.slug ?? ""] ?? null;
  if (tipos[unidade.tipoEstabelecimento ?? ""]) return tipos[unidade.tipoEstabelecimento];
  const categorias = [...new Set(unidade.segmentos?.map((s) => segmentos[s.slug ?? s.segmento?.slug ?? ""]).filter(Boolean))];
  return categorias.length === 1 ? categorias[0] : null;
}
function capaPersonalizada(unidade) {
  const url = unidade?.imagemCapaURL?.trim();
  if (!url || ["/banner.png", "/banners/principal.png"].includes(url)) return null;
  return /^https?:\/\//i.test(url) || url.startsWith("/") && !url.startsWith("//") ? url : null;
}
function iniciaisUsuario(nome) {
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => Array.from(p)[0]).join("").toUpperCase() || "U";
}
function resolverURLMidia(url, api) {
  return url.startsWith("/midias/") ? `${api.replace(/\/$/, "")}${url}` : url;
}

// src/midia/imagem-profissional.ts
var CHAVES_FOTOS_PROFISSIONAIS_LEGADAS = Array.from({ length: 6 }, (_, indice) => `profissional-${indice + 1}`);
function imagemProfissionalLegada(url) {
  const caminho = url?.trim().replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0];
  return !!caminho && /^\/profissionais\/profissional-[1-6]\.jpg$/i.test(caminho);
}
function imagemPadraoProfissional(sexo) {
  return sexo === "FEMININO" ? "/profissionais/avatar-feminino.png" : "/profissionais/avatar-masculino.png";
}
function urlImagemProfissional(url, sexo) {
  const imagem = url?.trim();
  const caminho = imagem?.replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0];
  if (!imagem || imagemProfissionalLegada(imagem) || /^\/profissionais\/avatar-(masculino|feminino)\.png$/i.test(caminho ?? "")) {
    if (sexo !== "FEMININO" && sexo !== "MASCULINO" && caminho?.endsWith("avatar-feminino.png")) return "/profissionais/avatar-feminino.png";
    return imagemPadraoProfissional(sexo);
  }
  return imagem;
}

// src/relacionamento/central.ts
var secoesRelacionamento = [
  { id: "clientes", titulo: "Clientes" },
  { id: "templates", titulo: "Templates" },
  { id: "campanhas", titulo: "Campanhas" },
  { id: "fidelidade", titulo: "Fideliza\xE7\xE3o" },
  { id: "envios", titulo: "Envios" },
  { id: "metricas", titulo: "M\xE9tricas" }
];
var canaisRelacionamento = ["PUSH", "EMAIL", "WHATSAPP"];
function objetoRelacionamento(valor) {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? valor : {};
}
function registrosRelacionamento(valor) {
  const lista = Array.isArray(valor) ? valor : objetoRelacionamento(valor).itens;
  return Array.isArray(lista) ? lista.map(objetoRelacionamento) : [];
}
function valorRelacionamento(dados, caminho) {
  return caminho.split(".").reduce((valor, chave) => objetoRelacionamento(valor)[chave], dados);
}
var base = "/relacionamento";
var fidelidade = `${base}/fidelidade`;
var campo = (chave, titulo, tipo = "texto", padrao, opcional = false) => ({ chave, titulo, tipo, padrao, opcional });
var escolha = (chave, titulo, valores) => ({ chave, titulo, opcoes: valores.map((valor) => ({ valor, titulo: valor.replace(/_/g, " ") })) });
var ativo = campo("ativo", "Ativo", "booleano", "false");
var camposProgramaRelacionamento = [ativo, campo("centavosPorPonto", "Centavos gastos por ponto", "numero", "100"), campo("validadeDias", "Validade dos pontos (dias)", "numero", "365"), campo("bonusIndicacao", "B\xF4nus por indica\xE7\xE3o (pontos)", "numero", "0"), campo("minimoIndicacaoCentavos", "Valor m\xEDnimo da indica\xE7\xE3o (centavos)", "numero", "0"), campo("niveis", "N\xEDveis: um por linha, no formato Nome;Pontos", "niveis", "Inicial;0")];
var camposTemplate = [campo("nome", "Nome"), escolha("evento", "Evento", ["CONFIRMACAO_AGENDAMENTO", "LEMBRETE_AGENDAMENTO", "CAMPANHA", "FIDELIDADE"]), escolha("canal", "Canal", canaisRelacionamento), campo("assunto", "Assunto", "texto", "", true), campo("conteudo", "Conte\xFAdo", "longo"), ativo];
var camposRecompensa = [campo("nome", "Nome"), campo("pontos", "Custo em pontos", "numero"), campo("descontoCentavos", "Desconto (centavos)", "numero"), ativo];
var camposCupom = [campo("codigo", "C\xF3digo"), campo("descontoCentavos", "Desconto (centavos)", "numero"), campo("inicio", "In\xEDcio (data e hora locais)", "data"), campo("fim", "Fim exclusivo (data e hora locais)", "data"), campo("limiteTotal", "Limite total", "numero", "100"), campo("limitePorCliente", "Limite por cliente", "numero", "1"), campo("minimoCentavos", "Gasto m\xEDnimo (centavos)", "numero", "0"), campo("elegibilidade.tags", "Tags eleg\xEDveis (separadas por v\xEDrgula)", "lista", "", true), campo("elegibilidade.servicoIds", "IDs dos servi\xE7os eleg\xEDveis (separados por v\xEDrgula)", "lista", "", true), campo("elegibilidade.primeiraVisita", "Somente primeira visita", "booleano", "false"), ativo];
function formulariosRelacionamento(secao, clientes2, templates) {
  const selecionarCliente = (chave, titulo) => ({ chave, titulo, opcoes: clientes2.map((c) => ({ valor: String(c.id), titulo: `${String(objetoRelacionamento(c.usuario).nome ?? "Cliente")} \xB7 #${c.id}` })) });
  if (secao === "templates") return [{ titulo: "Novo template", caminho: `${base}/templates`, metodo: "POST", campos: camposTemplate, aviso: "Vari\xE1veis de campanha: {{nome}}, {{estabelecimento}} e {{descadastroUrl}}. O canal s\xF3 enviar\xE1 com consentimento." }];
  if (secao === "campanhas") return [{ titulo: "Nova campanha", caminho: `${base}/campanhas`, metodo: "POST", campos: [campo("nome", "Nome"), { chave: "templateId", titulo: "Template de campanha ativo", opcoes: templates.filter((t) => t.ativo && t.evento === "CAMPANHA").map((t) => ({ valor: String(t.id), titulo: `${t.nome} \xB7 ${t.canal}` })) }, campo("filtros.tags", "Tags (qualquer uma, separadas por v\xEDrgula)", "lista", "", true), ...["unidadeId", "servicoId", "profissionalId"].map((chave) => campo(`filtros.${chave}`, `Filtro por ${chave.replace("Id", "")} (ID opcional)`, "numero", "", true)), campo("filtros.recorrenciaMinima", "M\xEDnimo de visitas conclu\xEDdas", "numero", "", true), campo("filtros.inatividadeDias", "Inatividade m\xEDnima em dias", "numero", "", true), campo("intervaloMinimoHoras", "Intervalo m\xEDnimo entre campanhas (24 a 720 horas)", "numero", "168")] }];
  if (secao === "fidelidade") return [
    { titulo: "Nova recompensa", caminho: `${fidelidade}/recompensas`, metodo: "POST", campos: camposRecompensa },
    { titulo: "Novo cupom", caminho: `${fidelidade}/cupons`, metodo: "POST", campos: camposCupom },
    { titulo: "Registrar indica\xE7\xE3o", caminho: `${fidelidade}/indicacoes`, metodo: "POST", campos: [selecionarCliente("indicadorId", "Quem indicou"), selecionarCliente("indicadoId", "Cliente indicado")], aviso: "A indica\xE7\xE3o exige revis\xE3o humana de identidade antes da aprova\xE7\xE3o. N\xE3o concede consentimento de marketing." }
  ];
  return [];
}
function formulariosBeneficioRelacionamento() {
  const agendamento = campo("_agendamentoId", "N\xFAmero do agendamento (consulte na agenda)", "numero");
  const chave = { ...campo("chaveIdempotencia", "Chave da opera\xE7\xE3o", "texto", `central-${Date.now()}-${Math.random().toString(36).slice(2)}`), oculto: true };
  const caminho = `${fidelidade}/agendamentos/:agendamentoId/beneficio`;
  return [
    { titulo: "Consultar benef\xEDcio do agendamento", caminho, metodo: "GET", campos: [agendamento] },
    { titulo: "Aplicar cupom no agendamento", caminho, metodo: "POST", campos: [agendamento, campo("codigoCupom", "C\xF3digo do cupom"), chave], confirmar: "Confirma a reserva do desconto neste atendimento?" },
    { titulo: "Resgatar recompensa no agendamento", caminho, metodo: "POST", campos: [agendamento, campo("recompensaId", "N\xFAmero da recompensa", "numero"), chave], confirmar: "Confirma o consumo dos pontos do cliente e a reserva do desconto?" },
    { titulo: "Cancelar benef\xEDcio do agendamento", caminho: `${caminho}/cancelar`, metodo: "POST", campos: [agendamento], confirmar: "Cancelar o benef\xEDcio reservado? O estorno seguir\xE1 a validade original dos pontos." }
  ];
}
function formularioSupressaoRelacionamento(clienteId) {
  return { titulo: "Supress\xE3o de campanhas", caminho: `${base}/campanhas/supressoes`, metodo: "POST", campos: [{ ...campo("clienteId", "Cliente", "numero", String(clienteId)), oculto: true }, escolha("canal", "Canal", canaisRelacionamento), campo("ativa", "Bloquear campanhas neste canal", "booleano", "true"), campo("motivo", "Motivo")], confirmar: "Confirmo a altera\xE7\xE3o. Remover bloqueio n\xE3o concede consentimento de comunica\xE7\xE3o." };
}
function formularioClienteRelacionamento(cliente) {
  return { titulo: "Editar relacionamento", caminho: `${base}/clientes/${cliente.id}`, metodo: "PUT", campos: [escolha("status", "Status", ["ATIVO", "INATIVO", "BLOQUEADO"]), campo("tags", "Tags (separadas por v\xEDrgula)", "lista", "", true), campo("observacoes", "Observa\xE7\xF5es", "longo", "", true)] };
}
function formularioPreferenciaRelacionamento(clienteId, canal) {
  return { titulo: `Prefer\xEAncia ${canal}`, caminho: `${base}/clientes/${clienteId}/preferencias`, metodo: "PUT", campos: [campo("consentido", "Cliente autorizou este canal", "booleano", "false"), campo("versaoTermos", "Vers\xE3o dos termos apresentados")], aviso: "Registre somente autoriza\xE7\xE3o expl\xEDcita do cliente. Importa\xE7\xE3o de contato n\xE3o \xE9 consentimento.", confirmar: "Confirmo que esta prefer\xEAncia corresponde \xE0 manifesta\xE7\xE3o do cliente." };
}
function acoesRegistroRelacionamento(secao, registro) {
  const id = Number(registro.id);
  if (!id) return [];
  if (secao === "templates") return [{ titulo: "Editar template", caminho: "", formulario: { titulo: "Editar template", caminho: `${base}/templates/${id}`, metodo: "PUT", campos: camposTemplate } }];
  if (secao === "campanhas") {
    const caminho = `${base}/campanhas/${id}`;
    if (registro.status === "RASCUNHO" && !registro.audienciaCongeladaEm) return [{ titulo: "Congelar audi\xEAncia", caminho: `${caminho}/congelar`, confirmar: "Congelar p\xFAblico e conte\xFAdo? Ap\xF3s esta a\xE7\xE3o, eles n\xE3o poder\xE3o ser editados." }];
    if (registro.status === "RASCUNHO") return [{ titulo: "Agendar disparo", caminho: "", formulario: { titulo: "Agendar disparo", caminho: `${caminho}/agendar`, metodo: "POST", campos: [campo("agendadoPara", "Data e hora locais do disparo", "data")], confirmar: "Confirma o agendamento do envio para a audi\xEAncia congelada?" } }];
    if (["AGENDADA", "EM_EXECUCAO"].includes(String(registro.status))) return [{ titulo: "Pausar campanha", caminho: `${caminho}/pausar`, confirmar: "Pausar novos envios? Mensagens j\xE1 entregues ao provedor n\xE3o podem ser recolhidas." }];
    if (registro.status === "PAUSADA") return [{ titulo: "Retomar campanha", caminho: `${caminho}/retomar`, confirmar: "Retomar os envios desta campanha agora?" }];
  }
  if (secao === "envios" && !registro.campanhaId && ["FILA_MORTA", "FALHA_PERMANENTE"].includes(String(registro.status))) return [{ titulo: "Reprocessar envio", caminho: "", formulario: { titulo: "Reprocessar envio", caminho: `${base}/envios/${id}/reprocessar`, metodo: "POST", campos: [campo("tentativasAdicionais", "Tentativas adicionais", "numero", "3")], confirmar: "Autorizar novas tentativas desta mensagem?" } }];
  if (secao === "fidelidade") {
    if (registro.tipoRegistro === "recompensa" || registro.tipoRegistro === "cupom") return [{ titulo: "Editar oferta", caminho: "", formulario: { titulo: "Editar oferta", caminho: `${fidelidade}/${registro.tipoRegistro === "cupom" ? "cupons" : "recompensas"}/${id}`, metodo: "PUT", campos: registro.tipoRegistro === "cupom" ? camposCupom : camposRecompensa } }];
    if (registro.tipoRegistro === "indicacao" && registro.status === "PENDENTE") return [{ titulo: "Aprovar indica\xE7\xE3o", caminho: `${fidelidade}/indicacoes/${id}/aprovar`, confirmar: "Confirma a revis\xE3o da identidade dos clientes e aus\xEAncia de autoindica\xE7\xE3o?" }];
  }
  return [];
}
function prepararFormularioRelacionamento(form, valores, canal) {
  const resultado = {};
  for (const c of form.campos) {
    const texto = (valores[c.chave] ?? "").trim();
    if (!texto && c.opcional) {
      if (c.tipo === "lista") definir(resultado, c.chave, []);
      else if (c.chave === "observacoes" || c.chave === "assunto") definir(resultado, c.chave, null);
      continue;
    }
    if (!texto) throw new Error(`Preencha: ${c.titulo}`);
    let valor = texto;
    if (c.opcoes && !c.opcoes.some((o) => o.valor === texto)) throw new Error(`Selecione: ${c.titulo}`);
    if (c.tipo === "numero" || /Id$/.test(c.chave)) {
      const numero = Number(texto);
      if (!Number.isSafeInteger(numero) || numero < 0) throw new Error(`N\xFAmero inv\xE1lido: ${c.titulo}`);
      valor = numero;
    }
    if (c.tipo === "booleano") valor = texto === "true";
    if (c.tipo === "lista") {
      valor = texto.split(",").map((v) => v.trim()).filter(Boolean);
      if (c.chave.endsWith("servicoIds")) {
        valor = valor.map(Number);
        if (valor.some((n) => !Number.isSafeInteger(n) || n <= 0)) throw new Error("IDs de servi\xE7os inv\xE1lidos");
      }
    }
    if (c.tipo === "data") valor = instanteLocalRelacionamento(texto);
    if (c.tipo === "niveis") valor = texto.split("\n").filter((v) => v.trim()).map((linha) => {
      const [nome, pontos] = linha.split(";");
      if (!nome?.trim() || !pontos?.trim() || !Number.isSafeInteger(Number(pontos))) throw new Error("Use um n\xEDvel por linha: Nome;Pontos");
      return { nome: nome.trim(), pontos: Number(pontos) };
    });
    definir(resultado, c.chave, valor);
  }
  if (canal) return { preferencias: [{ ...resultado, canal, origem: "ESTABELECIMENTO" }] };
  return resultado;
}
function instanteLocalRelacionamento(texto) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(texto);
  if (!partes) throw new Error("Informe data e hora locais no formato AAAA-MM-DDTHH:mm");
  const [, ano, mes, dia, hora, minuto] = partes.map(Number);
  const data = new Date(ano, mes - 1, dia, hora, minuto);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia || data.getHours() !== hora || data.getMinutes() !== minuto) throw new Error("Data ou hora inexistente");
  return data.toISOString();
}
function definir(objeto, caminho, valor) {
  const partes = caminho.split(".");
  const chave = partes.pop();
  let atual = objeto;
  for (const parte of partes) {
    if (!atual[parte]) atual[parte] = {};
    atual = objetoRelacionamento(atual[parte]);
  }
  atual[chave] = valor;
}
function valoresFormularioRelacionamento(form, registro = {}) {
  return Object.fromEntries(form.campos.map((c) => {
    const valor = valorRelacionamento(registro, c.chave);
    if (valor == null) return [c.chave, c.padrao ?? c.opcoes?.[0]?.valor ?? ""];
    if (c.tipo === "niveis" && Array.isArray(valor)) return [c.chave, valor.map((n) => `${objetoRelacionamento(n).nome};${objetoRelacionamento(n).pontos}`).join("\n")];
    if (c.tipo === "data") {
      const data = new Date(String(valor));
      return [c.chave, new Date(data.getTime() - data.getTimezoneOffset() * 6e4).toISOString().slice(0, 16)];
    }
    return [c.chave, Array.isArray(valor) ? valor.join(", ") : String(valor)];
  }));
}

// src/relacionamento/central-store.ts
var CentralRelacionamentoStore = class {
  constructor(api) {
    this.api = api;
    this.ouvintes = /* @__PURE__ */ new Set();
    this.revisao = 0;
    this.ativo = true;
    this.snapshot = () => this.estado;
    this.subscribe = (ouvinte) => {
      this.ouvintes.add(ouvinte);
      return () => {
        this.ouvintes.delete(ouvinte);
      };
    };
    this.encerrar = () => {
      this.ativo = false;
      this.revisao++;
      this.ouvintes.clear();
    };
    const agora = /* @__PURE__ */ new Date();
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    this.estado = { grupoFidelidade: "recompensas", secao: "clientes", permissoes: [], carregando: true, salvando: false, erro: "", mensagem: "", itens: [], total: 0, pagina: 1, busca: "", inicio: inicio.toISOString(), fim: agora.toISOString(), clientes: [], templates: [], programa: {}, selecionado: null, detalhe: null, paginaDetalhe: 1, totalDetalhe: 0 };
  }
  atualizar(dados) {
    if (!this.ativo) return;
    this.estado = { ...this.estado, ...dados };
    this.ouvintes.forEach((o) => o());
  }
  async iniciar() {
    this.ativo = true;
    try {
      const resposta = await this.api.get("/equipe/minhas-permissoes");
      this.atualizar({ permissoes: Array.isArray(resposta) ? resposta : [] });
      await this.carregar();
    } catch (e) {
      this.atualizar({ carregando: false, erro: mensagem(e) });
    }
  }
  async recarregar() {
    if (this.estado.salvando || !this.ativo) return;
    await this.iniciar();
    if (this.ativo && !this.estado.erro && this.estado.selecionado) await this.selecionar(this.estado.selecionado, this.estado.paginaDetalhe);
  }
  async carregar(alteracoes = {}) {
    const mudar = alteracoes.secao !== void 0 && alteracoes.secao !== this.estado.secao || alteracoes.grupoFidelidade !== void 0 && alteracoes.grupoFidelidade !== this.estado.grupoFidelidade;
    this.atualizar({ ...alteracoes, ...mudar ? { pagina: 1, selecionado: null, detalhe: null, itens: [], total: 0, mensagem: "" } : {}, carregando: true, erro: "" });
    const versao = ++this.revisao;
    const e = this.estado;
    if (!e.permissoes.includes("RELACIONAMENTO_VISUALIZAR")) {
      this.atualizar({ carregando: false, itens: [], selecionado: null, detalhe: null, clientes: [], templates: [], programa: {}, erro: "Voc\xEA n\xE3o tem permiss\xE3o para visualizar relacionamento." });
      return;
    }
    try {
      let itens = [];
      let total = 0;
      const extras = {};
      if (e.secao === "clientes") {
        const todos = registrosRelacionamento(await this.api.get(`/relacionamento/clientes?q=${encodeURIComponent(e.busca)}`));
        total = todos.length;
        itens = todos.slice((e.pagina - 1) * 25, e.pagina * 25);
      } else if (e.secao === "templates") {
        const todos = registrosRelacionamento(await this.api.get("/relacionamento/templates"));
        total = todos.length;
        itens = todos.slice((e.pagina - 1) * 25, e.pagina * 25);
        extras.templates = todos;
      } else if (e.secao === "fidelidade") {
        const [programa, indicacoes, clientes2] = await Promise.all([this.api.get("/relacionamento/fidelidade/programa"), e.grupoFidelidade === "indicacoes" ? this.api.get(`/relacionamento/fidelidade/indicacoes?pagina=${e.pagina}`) : Promise.resolve([]), e.grupoFidelidade === "indicacoes" ? this.api.get("/relacionamento/clientes") : Promise.resolve([])]);
        extras.programa = objetoRelacionamento(programa);
        extras.clientes = registrosRelacionamento(clientes2);
        const indicados = registrosRelacionamento(indicacoes).map((i) => ({ ...i, tipoRegistro: "indicacao", chaveRegistro: `indicacao:${i.id}` }));
        const ofertas = registrosRelacionamento(extras.programa[e.grupoFidelidade]).map((i) => ({ ...i, tipoRegistro: e.grupoFidelidade === "cupons" ? "cupom" : "recompensa", chaveRegistro: `${e.grupoFidelidade}:${i.id}` }));
        itens = e.grupoFidelidade === "indicacoes" ? indicados : ofertas.slice((e.pagina - 1) * 25, e.pagina * 25);
        total = e.grupoFidelidade === "indicacoes" ? (e.pagina - 1) * 50 + indicados.length + (indicados.length === 50 ? 1 : 0) : ofertas.length;
      } else if (e.secao === "metricas") {
        if (!e.permissoes.includes("FINANCEIRO_VISUALIZAR")) throw new Error("M\xE9tricas exigem tamb\xE9m permiss\xE3o de visualizar financeiro.");
        const dados = objetoRelacionamento(await this.api.get(`/relacionamento/governanca/metricas?inicio=${encodeURIComponent(e.inicio)}&fim=${encodeURIComponent(e.fim)}`));
        itens = ["funil", "atribuicao", "clientes", "regras", "periodo"].map((chave) => ({ ...objetoRelacionamento(dados[chave]), nome: chave, chaveRegistro: chave }));
        total = itens.length;
      } else {
        const resposta = objetoRelacionamento(await this.api.get(`/relacionamento/${e.secao}?pagina=${e.pagina}&limite=25`));
        itens = registrosRelacionamento(resposta);
        total = Number(resposta.total ?? itens.length);
        if (e.secao === "campanhas") extras.templates = registrosRelacionamento(await this.api.get("/relacionamento/templates"));
      }
      if (this.ativo && versao === this.revisao) this.atualizar({ ...extras, itens, total, carregando: false });
    } catch (erro) {
      if (versao === this.revisao) this.atualizar({ carregando: false, erro: mensagem(erro) });
    }
  }
  async selecionar(item, pagina = 1) {
    const versao = ++this.revisao;
    this.atualizar({ selecionado: item, detalhe: null, erro: "", paginaDetalhe: pagina, totalDetalhe: 0, carregando: !!item });
    if (!item) {
      this.atualizar({ carregando: false });
      return;
    }
    const secao = this.estado.secao;
    try {
      let detalhe = item;
      let total = 0;
      if (secao === "clientes") {
        const [cliente, preferencias, carteira] = await Promise.all([this.api.get(`/relacionamento/clientes/${item.id}`), this.api.get(`/relacionamento/clientes/${item.id}/preferencias`), this.api.get(`/relacionamento/fidelidade/clientes/${item.id}?pagina=${pagina}`)]);
        detalhe = { ...objetoRelacionamento(cliente), preferencias, carteira };
        total = Number(objetoRelacionamento(carteira).total ?? 0);
      } else if (secao === "campanhas") {
        const [campanha, audiencia] = await Promise.all([this.api.get(`/relacionamento/campanhas/${item.id}`), this.api.get(`/relacionamento/campanhas/${item.id}/audiencia?pagina=${pagina}&limite=25`)]);
        detalhe = { ...objetoRelacionamento(campanha), audiencia };
        total = Number(objetoRelacionamento(audiencia).total ?? 0);
      } else if (secao === "envios") detalhe = objetoRelacionamento(await this.api.get(`/relacionamento/envios/${item.id}`));
      if (this.ativo && versao === this.revisao) this.atualizar({ detalhe, selecionado: { ...item, ...detalhe }, totalDetalhe: total, carregando: false });
    } catch (erro) {
      if (versao === this.revisao) this.atualizar({ erro: mensagem(erro), carregando: false });
    }
  }
  async salvar(form, valores, canal) {
    if (this.estado.salvando || !this.estado.permissoes.includes(form.metodo === "GET" ? "RELACIONAMENTO_VISUALIZAR" : "RELACIONAMENTO_GERENCIAR")) return false;
    this.atualizar({ salvando: true, erro: "", mensagem: "" });
    try {
      const payload = prepararFormularioRelacionamento(form, valores, canal);
      let caminho = form.caminho;
      if (caminho.includes(":agendamentoId")) {
        if (!this.estado.permissoes.includes("AGENDA_GERENCIAR")) throw new Error("Benef\xEDcios exigem tamb\xE9m permiss\xE3o de gerenciar agenda.");
        if (typeof payload._agendamentoId !== "number" || !Number.isSafeInteger(payload._agendamentoId) || payload._agendamentoId <= 0) throw new Error("N\xFAmero do agendamento inv\xE1lido");
        caminho = caminho.replace(":agendamentoId", String(payload._agendamentoId));
        delete payload._agendamentoId;
      }
      const resposta = await (form.metodo === "GET" ? this.api.get(caminho) : form.metodo === "PUT" ? this.api.put(caminho, payload) : this.api.post(caminho, payload));
      if (caminho.includes("/agendamentos/")) {
        const detalhe = objetoRelacionamento(form.metodo === "GET" ? resposta : await this.api.get(caminho.replace(/\/cancelar$/, "")));
        this.atualizar({ selecionado: { nome: "Benef\xEDcios do agendamento", ...detalhe }, detalhe, mensagem: form.metodo === "GET" ? "" : "Benef\xEDcio atualizado com sucesso." });
        return true;
      }
      await this.carregar();
      if (this.estado.selecionado) await this.selecionar(this.estado.selecionado, this.estado.paginaDetalhe);
      this.atualizar({ mensagem: "Altera\xE7\xE3o registrada com sucesso." });
      return true;
    } catch (erro) {
      this.atualizar({ erro: mensagem(erro) });
      return false;
    } finally {
      this.atualizar({ salvando: false });
    }
  }
};
function limitePaginaRelacionamento(estado) {
  return estado.secao === "fidelidade" && estado.grupoFidelidade === "indicacoes" ? 50 : 25;
}
function mensagem(erro) {
  return erro instanceof Error ? erro.message : "N\xE3o foi poss\xEDvel carregar relacionamento.";
}

// src/relacionamento/apresentacao.ts
function tituloRegistroRelacionamento(item) {
  const usuario = objetoRelacionamento(item.usuario);
  return String(usuario.nome ?? item.nome ?? item.codigo ?? (item.tipoRegistro === "indicacao" ? `Indica\xE7\xE3o #${item.id}` : `Registro #${item.id}`));
}
var rotulos = { id: "Identificador", usuario: "Cliente", nome: "Nome", status: "Status", ativo: "Ativo", codigo: "C\xF3digo", telefone: "Telefone", email: "E-mail", tags: "Tags", observacoes: "Observa\xE7\xF5es", ultimoAgendamentoEm: "\xDAltimo agendamento", ultimaInteracaoEm: "\xDAltima intera\xE7\xE3o", canal: "Canal", evento: "Evento", assunto: "Assunto", conteudo: "Conte\xFAdo", consentido: "Consentimento", consentidoEm: "Autorizado em", revogadoEm: "Revogado em", origem: "Origem", versaoTermos: "Vers\xE3o dos termos", saldo: "Saldo de pontos", pontos: "Pontos", nivel: "N\xEDvel", pontosAcumulados: "Pontos acumulados", calculadoEm: "Calculado em", expiraEm: "Validade", extrato: "Extrato", lotes: "Lotes v\xE1lidos", carteira: "Fideliza\xE7\xE3o", preferencias: "Prefer\xEAncias", tipo: "Tipo", createdAt: "Criado em", enviadoEm: "Enviado em", agendadoPara: "Agendado para", audienciaCongeladaEm: "Audi\xEAncia congelada em", tentativas: "Tentativas", callbacks: "Eventos do provedor", erro: "Erro", numero: "Tentativa", indicadorId: "Cliente indicador (ID)", indicadoId: "Cliente indicado (ID)", descontoCentavos: "Desconto em centavos", minimoCentavos: "M\xEDnimo em centavos", limiteTotal: "Limite total", limitePorCliente: "Limite por cliente", inicio: "In\xEDcio", fim: "Fim exclusivo", filtros: "Filtros", elegibilidade: "Elegibilidade", itens: "Registros", total: "Total", audiencia: "Audi\xEAncia", envios: "Envios", usuarioId: "ID do usu\xE1rio", motivo: "Motivo", evidencia: "Evid\xEAncia", proximaTentativaEm: "Pr\xF3xima tentativa", maximoTentativas: "M\xE1ximo de tentativas", provedor: "Provedor" };
var ocultos = /* @__PURE__ */ new Set(["chaveIdempotencia", "chave", "metadados", "payload", "templateSnapshot", "referenciaExterna", "referenciaVerificacao", "chaveRegistro", "tipoRegistro", "estabelecimentoId", "lockToken", "lockAte", "destino", "dadosExpurgadosEm"]);
function rotuloRelacionamento(chave) {
  return rotulos[chave] ?? chave.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
}
function linhasRelacionamento(dados, prefixo = "", profundidade = 0) {
  if (profundidade > 5 || dados == null) return [];
  if (Array.isArray(dados)) return dados.flatMap((valor, i) => typeof valor === "object" ? linhasRelacionamento(valor, `${prefixo} ${i + 1}`, profundidade + 1) : [{ titulo: prefixo, valor: String(valor) }]);
  return Object.entries(objetoRelacionamento(dados)).filter(([chave]) => !ocultos.has(chave)).flatMap(([chave, valor]) => {
    const titulo = `${prefixo ? `${prefixo} \xB7 ` : ""}${rotuloRelacionamento(chave)}`;
    if (valor == null) return [{ titulo, valor: "N\xE3o informado" }];
    if (typeof valor === "object") return linhasRelacionamento(valor, titulo, profundidade + 1);
    const texto = typeof valor === "boolean" ? valor ? "Sim" : "N\xE3o" : String(valor);
    const formatado = /^\d{4}-\d{2}-\d{2}T/.test(texto) && Number.isFinite(new Date(texto).getTime()) ? new Date(texto).toLocaleString("pt-BR") : texto;
    return [{ titulo, valor: formatado }];
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgendaUtils,
  BuscarAgendaProfissionalPorDia,
  BuscarAgendamentosCliente,
  BuscarProfissionais,
  BuscarServicos,
  CHAVES_FOTOS_PROFISSIONAIS_LEGADAS,
  CentralRelacionamentoStore,
  DateUtils,
  ExcluirAgendamento,
  Horarios,
  LoginUsuario,
  METRICAS_FLUXO_ATENDIMENTO,
  MoedaUtils,
  NovoAgendamento,
  OPCOES_FLUXO_ATENDIMENTO,
  OPCOES_LOGO_ESTABELECIMENTO,
  ORIGENS_TRANSICAO_ATENDIMENTO,
  ObterHorariosOcupados,
  ROTULOS_ACOES,
  ROTULOS_STATUS_AGENDAMENTO,
  RegistrarUsuario,
  STATUS_AGENDAMENTO,
  STATUS_TRANSICAO_ATENDIMENTO,
  TEMPO_SLOT,
  TIPOS_TRANSICAO_ATENDIMENTO,
  acoesAtendimento,
  acoesRegistroRelacionamento,
  atendimentoTerminal,
  camposProgramaRelacionamento,
  canaisRelacionamento,
  capaPersonalizada,
  categoriaIdentidade,
  clientes,
  comecaEmDezMinutos,
  dataAtendimento,
  formularioClienteRelacionamento,
  formularioPreferenciaRelacionamento,
  formularioSupressaoRelacionamento,
  formulariosBeneficioRelacionamento,
  formulariosRelacionamento,
  horarioAtendimento,
  imagemPadraoProfissional,
  imagemProfissionalLegada,
  iniciaisUsuario,
  instanteLocalRelacionamento,
  intervaloDiaAtendimento,
  limitePaginaRelacionamento,
  linhasRelacionamento,
  objetoRelacionamento,
  prepararFormularioRelacionamento,
  profissionais,
  registrosRelacionamento,
  resolverURLMidia,
  rotuloRelacionamento,
  rotuloStatus,
  secoesRelacionamento,
  servicos,
  statusAgendamentoValido,
  tituloRegistroRelacionamento,
  urlImagemProfissional,
  valorRelacionamento,
  valoresFormularioRelacionamento
});
