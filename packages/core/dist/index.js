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
  DateUtils: () => DateUtils,
  ExcluirAgendamento: () => ExcluirAgendamento,
  Horarios: () => Horarios,
  LoginUsuario: () => LoginUsuario,
  MoedaUtils: () => MoedaUtils,
  NovoAgendamento: () => NovoAgendamento,
  ObterHorariosOcupados: () => ObterHorariosOcupados,
  RegistrarUsuario: () => RegistrarUsuario,
  TEMPO_SLOT: () => TEMPO_SLOT,
  clientes: () => clientes_default,
  profissionais: () => profissionais_default,
  servicos: () => servicos_default
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
    const mesmaBarbearia = agendamento.barbeariaId === usuario.barbeariaId;
    const profissional = usuario.barbeiro && mesmaBarbearia;
    if (!cliente && !profissional) {
      throw new Error("Usu\xE1rio n\xE3o autorizado");
    }
    await this.repo.excluir(id);
  }
};

// src/utils/AgendaUtils.ts
var AgendaUtils = class {
  static horariosDoDia() {
    return {
      manha: this.gerarHorarios([8, 9, 10, 11]),
      tardeNoite: this.gerarHorarios([13, 14, 15, 16, 17, 18, 19, 20])
    };
  }
  static duracaoTotal(servicos2) {
    const duracao = servicos2.reduce((total, servico) => total + servico.qtdeSlots * 15, 0);
    const horas = Math.floor(duracao / 60);
    const minutos = duracao % 60;
    return `${horas}h ${minutos.toString().padStart(2, "0")}m`;
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
  constructor(inicio, qtde, horariosOcupados) {
    this.inicio = inicio;
    this.qtde = qtde;
    this.horariosOcupados = horariosOcupados;
  }
  get todos() {
    const { manha, tardeNoite } = AgendaUtils.horariosDoDia();
    const horarios = manha.includes(this.inicio) ? manha : tardeNoite;
    const indice = horarios.indexOf(this.inicio);
    return horarios.slice(indice, indice + this.qtde);
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

// src/constants/clientes.ts
var clientes = [
  {
    id: 1,
    imagemURL: "/clientes/cliente-1.jpg",
    nome: "Ricardo Soundbar",
    testemunho: 'Chega falando alto e ocupando espa\xE7o com seu tamanho de viking, mas que tem um cora\xE7\xE3o do tamanho de seu topete! Um verdadeiro gigante gente boa, ele sempre diz: "Os caras aqui s\xE3o brutais no corte e na amizade! Servi\xE7o top, recomendo de olhos fechados!"'
  },
  {
    id: 2,
    imagemURL: "/clientes/cliente-2.jpg",
    nome: 'Tiaguinho - "O Atacante"',
    testemunho: 'Fan\xE1tico por futebol! Ele sempre chega animado, pronto para bater um papo e discutir o \xFAltimo jogo. Tiaguinho sempre diz: "Cortar cabelo aqui \xE9 muito legal, mas eu prefiro fazer gol!"'
  },
  {
    id: 3,
    imagemURL: "/clientes/cliente-3.jpg",
    nome: "Patr\xEDcia",
    testemunho: 'Nossa cliente com o cabelo mais vermelho do bairro e uma paix\xE3o por doramas que n\xE3o tem fim! Patr\xEDcia diz: "Aqui \xE9 meu lugar favorito! Saio com o cabelo perfeito e ainda compartilho todos os dramas dos doramas. Servi\xE7o top demais!"'
  },
  {
    id: 4,
    imagemURL: "/clientes/cliente-4.jpg",
    nome: "Sr. Carlos",
    testemunho: 'Nosso cliente mais velho e cheio de hist\xF3rias incr\xEDveis que nunca se repetem! Ele anima a barbearia com suas aventuras e sabedoria. Sr. Carlos diz: "A Barba Brutal \xE9 raiz, me lembra a barbearia que eu ia quando era moleque. Servi\xE7o excelente e hist\xF3rias boas garantidas"'
  }
];
var clientes_default = clientes;

// src/constants/profissionais.ts
var profissionais = [
  {
    id: 1,
    nome: "Marc\xE3o Machadada",
    descricao: "Salve, salve, galera! Sou o Marc\xE3o Machadada, o \xFAnico cabeleireiro que pode transformar uma juba de le\xE3o em um corte digno de um rei com um \xFAnico movimento de tesoura.",
    imagemURL: "/profissionais/profissional-1.jpg",
    avaliacao: 5,
    quantidadeAvaliacoes: 87
  },
  {
    id: 2,
    nome: "Beto Brutal",
    descricao: "Quando o assunto \xE9 barba, ningu\xE9m faz melhor que Beto Brutal! Suas l\xE2minas afiadas s\xE3o lend\xE1rias e seu estilo \xE9 inconfund\xEDvel. Para um visual marcante e robusto, ele \xE9 o seu homem!",
    imagemURL: "/profissionais/profissional-2.jpg",
    avaliacao: 4.5,
    quantidadeAvaliacoes: 39
  },
  {
    id: 3,
    nome: "Kathya Tesourada",
    descricao: "Kathya n\xE3o tem medo de tesourar! Com precis\xE3o e ousadia, ela transforma qualquer cabelo em uma obra-prima r\xFAstica. Seu lema? Corte raiz sem perder a feminilidade!",
    imagemURL: "/profissionais/profissional-3.jpg",
    avaliacao: 5,
    quantidadeAvaliacoes: 91
  },
  {
    id: 4,
    nome: "S\xE9rgio Serrador",
    descricao: "S\xE9rgio \xE9 conhecido por sua t\xE9cnica impec\xE1vel e estilo \xFAnico. Com sua serra (ou melhor, tesoura) em m\xE3os, ele cria visuais que impressionam. Barba bem-feita \xE9 com ele mesmo!",
    imagemURL: "/profissionais/profissional-4.jpg",
    avaliacao: 4.5,
    quantidadeAvaliacoes: 29
  },
  {
    id: 5,
    nome: "Rafa Raspa Tudo",
    descricao: "Para aqueles que preferem um look mais rente, Rafa \xE9 o especialista! Sua m\xE1quina raspa tudo com precis\xE3o, deixando um acabamento perfeito. Raspar \xE9 a sua arte!",
    imagemURL: "/profissionais/profissional-5.jpg",
    avaliacao: 4.5,
    quantidadeAvaliacoes: 44
  },
  {
    id: 6,
    nome: "Fernanda Fa\xEDsca",
    descricao: "Fernanda traz um toque de brilho e energia a cada corte. Com suas l\xE2minas \xE1geis, ela faz milagres em qualquer tipo de cabelo. Precisa de um look cheio de fa\xEDsca? \xC9 com ela mesmo!",
    imagemURL: "/profissionais/profissional-6.jpg",
    avaliacao: 5,
    quantidadeAvaliacoes: 46
  }
];
var profissionais_default = profissionais;

// src/constants/servicos.ts
var servicos = [
  {
    id: 1,
    nome: "Corte Viking",
    descricao: "Venha receber um corte de Viking, com l\xE2mina na pele e estilo de guerreiro. Saia pronto para enfrentar qualquer batalha com um visual que imp\xF5e respeito.",
    preco: 55,
    qtdeSlots: 3,
    imagemURL: "/servicos/corte-de-cabelo.jpg"
  },
  {
    id: 2,
    nome: "Barba de Lenhador",
    descricao: "Venha dar um trato na sua barba de lenhador, com aparo preciso e estilo de macho raiz. Saia com uma barba que imp\xF5e respeito e faz tremer at\xE9 as \xE1rvores.",
    preco: 45,
    qtdeSlots: 2,
    imagemURL: "/servicos/corte-de-barba.jpg"
  },
  {
    id: 3,
    nome: "Garras Brutais",
    descricao: "Venha transformar suas patas de urso em garras de lobo. Nosso servi\xE7o de Manicure & Pedicure para homens \xE9 t\xE3o bruto quanto voc\xEA, mas com um toque de classe.",
    preco: 40,
    qtdeSlots: 2,
    imagemURL: "/servicos/manicure-pedicure.jpg"
  },
  {
    id: 4,
    nome: "Combo Alpha",
    descricao: 'Nosso combo "Alpha" inclui um corte de cabelo de Viking, uma barba de lenhador e manicure & pedicure de gladiador. Saia pronto para enfrentar qualquer batalha com estilo e unhas afiadas.',
    preco: 95,
    qtdeSlots: 2,
    imagemURL: "/servicos/combo.jpg"
  },
  {
    id: 5,
    nome: "Pequeno Ca\xE7ador",
    descricao: "Transforme seu pequeno aventureiro em um mini ca\xE7ador, com um corte cheio de atitude e estilo. Cabelo afiado como uma guitarra e maneiro como uma Harley.",
    preco: 60,
    qtdeSlots: 2,
    imagemURL: "/servicos/corte-infantil.jpg"
  },
  {
    id: 6,
    nome: "Noivo Raiz",
    descricao: "Prepare-se para o grande dia com um tratamento digno de um verdadeiro guerreiro da estrada. Corte de cabelo afiado, barba de lenhador e manicure de motoqueiro, tudo enquanto voc\xEA relaxa ao som de rock pesado.",
    preco: 189,
    qtdeSlots: 5,
    imagemURL: "/servicos/dia-de-noivo.jpg"
  }
];
var servicos_default = servicos;

// src/constants/index.ts
var TEMPO_SLOT = 15;

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
      barbeiro: false
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgendaUtils,
  BuscarAgendaProfissionalPorDia,
  BuscarAgendamentosCliente,
  BuscarProfissionais,
  BuscarServicos,
  DateUtils,
  ExcluirAgendamento,
  Horarios,
  LoginUsuario,
  MoedaUtils,
  NovoAgendamento,
  ObterHorariosOcupados,
  RegistrarUsuario,
  TEMPO_SLOT,
  clientes,
  profissionais,
  servicos
});
