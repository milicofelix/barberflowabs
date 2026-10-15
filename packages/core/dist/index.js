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
  DateUtils: () => DateUtils,
  ExcluirAgendamento: () => ExcluirAgendamento,
  Horarios: () => Horarios,
  LoginUsuario: () => LoginUsuario,
  MoedaUtils: () => MoedaUtils,
  NovoAgendamento: () => NovoAgendamento,
  ORIGENS_TRANSICAO_ATENDIMENTO: () => ORIGENS_TRANSICAO_ATENDIMENTO,
  ObterHorariosOcupados: () => ObterHorariosOcupados,
  ROTULOS_STATUS_AGENDAMENTO: () => ROTULOS_STATUS_AGENDAMENTO,
  RegistrarUsuario: () => RegistrarUsuario,
  STATUS_AGENDAMENTO: () => STATUS_AGENDAMENTO,
  STATUS_TRANSICAO_ATENDIMENTO: () => STATUS_TRANSICAO_ATENDIMENTO,
  TEMPO_SLOT: () => TEMPO_SLOT,
  TIPOS_TRANSICAO_ATENDIMENTO: () => TIPOS_TRANSICAO_ATENDIMENTO,
  capaPersonalizada: () => capaPersonalizada,
  categoriaIdentidade: () => categoriaIdentidade,
  clientes: () => clientes_default,
  imagemPadraoProfissional: () => imagemPadraoProfissional,
  imagemProfissionalLegada: () => imagemProfissionalLegada,
  iniciaisUsuario: () => iniciaisUsuario,
  profissionais: () => profissionais_default,
  resolverURLMidia: () => resolverURLMidia,
  servicos: () => servicos_default,
  statusAgendamentoValido: () => statusAgendamentoValido,
  urlImagemProfissional: () => urlImagemProfissional
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgendaUtils,
  BuscarAgendaProfissionalPorDia,
  BuscarAgendamentosCliente,
  BuscarProfissionais,
  BuscarServicos,
  CHAVES_FOTOS_PROFISSIONAIS_LEGADAS,
  DateUtils,
  ExcluirAgendamento,
  Horarios,
  LoginUsuario,
  MoedaUtils,
  NovoAgendamento,
  ORIGENS_TRANSICAO_ATENDIMENTO,
  ObterHorariosOcupados,
  ROTULOS_STATUS_AGENDAMENTO,
  RegistrarUsuario,
  STATUS_AGENDAMENTO,
  STATUS_TRANSICAO_ATENDIMENTO,
  TEMPO_SLOT,
  TIPOS_TRANSICAO_ATENDIMENTO,
  capaPersonalizada,
  categoriaIdentidade,
  clientes,
  imagemPadraoProfissional,
  imagemProfissionalLegada,
  iniciaisUsuario,
  profissionais,
  resolverURLMidia,
  servicos,
  statusAgendamentoValido,
  urlImagemProfissional
});
