import { Servico } from "../servico";

const servicos: Servico[] = [
  {
    id: 1,
    nome: "Corte Social",
    descricao:
      "Corte masculino alinhado, com acabamento preciso e pensado para o dia a dia.",
    preco: 55,
    qtdeSlots: 3,
    imagemURL: "/servicos/corte-de-cabelo.jpg",
  },
  {
    id: 2,
    nome: "Barba Completa",
    descricao:
      "Aparo, desenho e finalização da barba para manter o visual bem cuidado.",
    preco: 45,
    qtdeSlots: 2,
    imagemURL: "/servicos/corte-de-barba.jpg",
  },
  {
    id: 3,
    nome: "Manicure e Pedicure",
    descricao:
      "Cuidado completo para mãos e pés, com higiene, conforto e acabamento profissional.",
    preco: 40,
    qtdeSlots: 2,
    imagemURL: "/servicos/manicure-pedicure.jpg",
  },
  {
    id: 4,
    nome: "Combo Corte e Barba",
    descricao:
      "Corte e barba no mesmo atendimento para quem busca praticidade e resultado completo.",
    preco: 95,
    qtdeSlots: 2,
    imagemURL: "/servicos/combo.jpg",
  },
  {
    id: 5,
    nome: "Corte Infantil",
    descricao:
      "Atendimento infantil com cuidado, paciência e um corte adequado para cada idade.",
    preco: 60,
    qtdeSlots: 2,
    imagemURL: "/servicos/corte-infantil.jpg",
  },
  {
    id: 6,
    nome: "Dia do Noivo",
    descricao:
      "Pacote especial para preparação do noivo, com corte, barba e cuidados de apresentação.",
    preco: 189,
    qtdeSlots: 5,
    imagemURL: "/servicos/dia-de-noivo.jpg",
  },
];

export default servicos;
