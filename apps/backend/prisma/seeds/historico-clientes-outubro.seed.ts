import type { PrismaClient } from '@prisma/client';
import { estabelecimentosMarketplaceTatuape } from './marketplace-tatuape.data';

const INICIO = 1;
const FIM = 10;
const ANO = 2026;
const MES = 10;
const HORARIOS = ['09:00', '16:00'];
const TOTAL_CLIENTES = 48;
const SENHA_PADRAO = '$2b$10$9LQTRK3LRzIddKYW2C4MTelydFzk5Ys4JoROPajNqvYshhrn1PRa6';

const primeirosNomes = [
  'Ana', 'Beatriz', 'Bruno', 'Camila', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda',
  'Gabriel', 'Helena', 'Isabela', 'João', 'Larissa', 'Lucas', 'Mariana', 'Mateus',
  'Natalia', 'Paulo', 'Renata', 'Rafael', 'Sabrina', 'Thiago', 'Vanessa', 'Vinicius',
];

const sobrenomes = ['Almeida', 'Barbosa', 'Campos', 'Dias', 'Freitas', 'Lima', 'Martins', 'Oliveira'];

interface ClienteSeed {
  id: number;
  nome: string;
}

export async function seedHistoricoClientesOutubro(prisma: PrismaClient) {
  const clientes = await criarClientes(prisma);
  let totalAgendamentos = 0;

  for (const [indiceEstabelecimento, item] of estabelecimentosMarketplaceTatuape.entries()) {
    const estabelecimento = await (prisma as any).estabelecimento.findUnique({
      where: { slug: item.slug },
      include: {
        unidades: { where: { ativa: true }, take: 1 },
        profissionais: { orderBy: { id: 'asc' }, take: 1 },
        servicos: { orderBy: { id: 'asc' } },
      },
    });
    if (!estabelecimento?.profissionais.length || !estabelecimento.servicos.length) continue;

    for (let dia = INICIO; dia <= FIM; dia += 1) {
      for (const [indiceHorario, horario] of HORARIOS.entries()) {
        const cliente = clientes[indiceCliente(dia, indiceEstabelecimento, indiceHorario)];
        const servico = estabelecimento.servicos[(dia + indiceHorario) % estabelecimento.servicos.length];
        const inicio = dataEmSaoPaulo(dia, horario);
        const duracao = Number(servico.duracaoMinutos ?? (servico.qtdeSlots ? servico.qtdeSlots * 15 : 15));
        const fim = new Date(inicio.getTime() + duracao * 60_000);

        const agendamento = await localizarOuCriarAgendamento(prisma, {
          estabelecimentoId: estabelecimento.id,
          usuarioId: cliente.id,
          profissionalId: estabelecimento.profissionais[0].id,
          unidadeId: estabelecimento.unidades[0]?.id ?? null,
          servico,
          inicio,
          fim,
          duracao,
        });
        await vincularCliente(prisma, estabelecimento.id, cliente.id, inicio);
        await registrarPreferencias(prisma, estabelecimento.id, cliente.id, indiceHorario);
        totalAgendamentos += agendamento ? 1 : 0;
      }
    }
  }

  return { clientes: clientes.length, agendamentos: totalAgendamentos, inicio: '2026-10-01', fim: '2026-10-10' };
}

async function criarClientes(prisma: PrismaClient): Promise<ClienteSeed[]> {
  const clientes: ClienteSeed[] = [];
  for (let indice = 0; indice < TOTAL_CLIENTES; indice += 1) {
    const nome = `${primeirosNomes[indice % primeirosNomes.length]} ${sobrenomes[Math.floor(indice / primeirosNomes.length) % sobrenomes.length]}`;
    const numero = String(indice + 1).padStart(2, '0');
    const usuario = await (prisma as any).usuario.upsert({
      where: { email: `cliente.historico.${numero}@demo.uniflowabs.app` },
      update: { nome, telefone: `(11) 98${numero}0-${String(1000 + indice)}`, papel: 'CUSTOMER', membroEstabelecimento: false },
      create: {
        nome, email: `cliente.historico.${numero}@demo.uniflowabs.app`, senha: SENHA_PADRAO,
        telefone: `(11) 98${numero}0-${String(1000 + indice)}`, papel: 'CUSTOMER', membroEstabelecimento: false,
      },
      select: { id: true, nome: true },
    });
    clientes.push(usuario);
  }
  return clientes;
}

async function localizarOuCriarAgendamento(prisma: PrismaClient, dados: any) {
  const existente = await (prisma as any).agendamento.findFirst({
    where: {
      estabelecimentoId: dados.estabelecimentoId,
      usuarioId: dados.usuarioId,
      profissionalId: dados.profissionalId,
      data: dados.inicio,
    },
    select: { id: true },
  });
  const valores = {
    estabelecimentoId: dados.estabelecimentoId,
    usuarioId: dados.usuarioId,
    profissionalId: dados.profissionalId,
    unidadeId: dados.unidadeId,
    data: dados.inicio,
    dataFim: dados.fim,
    inicioOcupacao: dados.inicio,
    fimOcupacao: dados.fim,
    status: 'CONCLUIDO',
    valorTotal: dados.servico.preco,
    modeloAtendimento: 'PRESENCIAL',
  };
  const agendamento = existente
    ? await (prisma as any).agendamento.update({
      where: { id: existente.id }, data: { ...valores, servicos: { set: [{ id: dados.servico.id }] } },
    })
    : await (prisma as any).agendamento.create({
      data: { ...valores, servicos: { connect: [{ id: dados.servico.id }] } },
    });

  await (prisma as any).agendamentoServico.upsert({
    where: { agendamentoId_ordem: { agendamentoId: agendamento.id, ordem: 1 } },
    update: {
      servicoId: dados.servico.id, duracaoMinutos: dados.duracao,
      preparoAntesMinutos: dados.servico.preparoAntesMinutos ?? 0,
      preparoDepoisMinutos: dados.servico.preparoDepoisMinutos ?? 0, preco: dados.servico.preco,
    },
    create: {
      agendamentoId: agendamento.id, servicoId: dados.servico.id, ordem: 1,
      duracaoMinutos: dados.duracao, preparoAntesMinutos: dados.servico.preparoAntesMinutos ?? 0,
      preparoDepoisMinutos: dados.servico.preparoDepoisMinutos ?? 0, preco: dados.servico.preco,
    },
  });
  return agendamento;
}

async function vincularCliente(prisma: PrismaClient, estabelecimentoId: number, usuarioId: number, data: Date) {
  const chave = { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId } };
  const atual = await (prisma as any).clienteEstabelecimento.findUnique({ where: chave });
  const primeiro = !atual?.primeiroAgendamentoEm || atual.primeiroAgendamentoEm > data ? data : atual.primeiroAgendamentoEm;
  const ultimo = !atual?.ultimoAgendamentoEm || atual.ultimoAgendamentoEm < data ? data : atual.ultimoAgendamentoEm;
  return (prisma as any).clienteEstabelecimento.upsert({
    where: chave,
    update: { primeiroAgendamentoEm: primeiro, ultimoAgendamentoEm: ultimo, status: 'ATIVO', ultimaInteracaoEm: ultimo },
    create: {
      estabelecimentoId, usuarioId, origem: 'SEED_HISTORICO', status: 'ATIVO',
      primeiroAgendamentoEm: data, ultimoAgendamentoEm: data, ultimaInteracaoEm: data,
    },
  });
}

async function registrarPreferencias(prisma: PrismaClient, estabelecimentoId: number, usuarioId: number, indice: number) {
  for (const canal of ['PUSH', 'EMAIL', 'WHATSAPP']) {
    const consentido = canal !== 'WHATSAPP' || indice === 0;
    await (prisma as any).preferenciaComunicacao.upsert({
      where: { estabelecimentoId_usuarioId_canal: { estabelecimentoId, usuarioId, canal } },
      update: {},
      create: {
        estabelecimentoId, usuarioId, canal, consentido, origem: 'SEED', versaoTermos: '2026-10',
        consentidoEm: consentido ? dataEmSaoPaulo(1, '08:00') : null,
        revogadoEm: consentido ? null : dataEmSaoPaulo(1, '08:00'),
      },
    });
  }
}

function indiceCliente(dia: number, estabelecimento: number, horario: number) {
  return ((dia - 1) * estabelecimentosMarketplaceTatuape.length * HORARIOS.length + estabelecimento * HORARIOS.length + horario) % TOTAL_CLIENTES;
}

function dataEmSaoPaulo(dia: number, horario: string) {
  return new Date(`${ANO}-${String(MES).padStart(2, '0')}-${String(dia).padStart(2, '0')}T${horario}:00-03:00`);
}
