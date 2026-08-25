import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';

const STATUS_ATENDIDOS = ['CONCLUIDO'];
const PERCENTUAL_COMISSAO_PADRAO = 40;

@Injectable()
export class GestaoPrisma {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(barbeariaId: number) {
    const hoje = new Date().toISOString().slice(0, 10);
    const { inicio, fim } = this.intervaloDia(hoje);
    const inicioMes = new Date(inicio);
    inicioMes.setUTCDate(1);
    inicioMes.setUTCHours(0, 0, 0, 0);

    const [agendamentosHoje, clientes, receitaHoje, receitaMes, despesasMes] =
      await Promise.all([
        this.prisma.agendamento.count({
          where: { barbeariaId, data: { gte: inicio, lte: fim } },
        }),
        this.prisma.usuario.count({ where: { barbeariaId, barbeiro: false } }),
        this.somarReceitas(barbeariaId, inicio, fim),
        this.somarReceitas(barbeariaId, inicioMes, fim),
        this.somarLancamentos(barbeariaId, 'DESPESA', inicioMes, fim),
      ]);

    return {
      data: hoje,
      agendamentosHoje,
      clientes,
      receitaHoje,
      receitaMes,
      despesasMes,
      saldoMes: receitaMes - despesasMes,
    };
  }

  async listarClientes(barbeariaId: number) {
    const clientes = await this.prisma.usuario.findMany({
      where: { barbeariaId, barbeiro: false },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        _count: { select: { agendamentos: true } },
      },
      orderBy: { nome: 'asc' },
    });

    return clientes.map((cliente) => ({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      totalAgendamentos: cliente._count.agendamentos,
    }));
  }

  async historicoCliente(id: number, barbeariaId: number) {
    const cliente = await this.prisma.usuario.findFirst({
      where: { id, barbeariaId, barbeiro: false },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        agendamentos: {
          include: {
            profissional: { select: { id: true, nome: true } },
            servicos: { select: { id: true, nome: true, preco: true } },
          },
          orderBy: { data: 'desc' },
        },
      },
    });

    if (!cliente) return null;

    return {
      ...cliente,
      agendamentos: cliente.agendamentos.map((agendamento) =>
        this.normalizarAgendamento(agendamento),
      ),
    };
  }

  async criarCliente(barbeariaId: number, dados: any) {
    const cliente = await this.prisma.usuario.create({
      data: {
        barbeariaId,
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone || null,
        senha: dados.senha,
        barbeiro: false,
      },
      select: { id: true, nome: true, email: true, telefone: true },
    });

    return { ...cliente, totalAgendamentos: 0 };
  }

  async atualizarCliente(id: number, barbeariaId: number, dados: any) {
    const cliente = await this.prisma.usuario.findFirst({
      where: { id, barbeariaId, barbeiro: false },
      select: { id: true },
    });

    if (!cliente) return null;

    return this.prisma.usuario.update({
      where: { id },
      data: {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone || null,
        ...(dados.senha ? { senha: dados.senha } : {}),
      },
      select: { id: true, nome: true, email: true, telefone: true },
    });
  }

  async excluirCliente(id: number, barbeariaId: number) {
    const cliente = await this.prisma.usuario.findFirst({
      where: { id, barbeariaId, barbeiro: false },
      select: { id: true },
    });

    if (!cliente) return null;
    return this.prisma.usuario.delete({ where: { id }, select: { id: true } });
  }

  async listarAgendamentos(barbeariaId: number, data: string) {
    const { inicio, fim } = this.intervaloDia(data);
    const agendamentos = await this.prisma.agendamento.findMany({
      where: { barbeariaId, data: { gte: inicio, lte: fim } },
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true } },
        profissional: { select: { id: true, nome: true } },
        servicos: { select: { id: true, nome: true, preco: true, qtdeSlots: true } },
      },
      orderBy: { data: 'asc' },
    });

    return agendamentos.map((agendamento) => this.normalizarAgendamento(agendamento));
  }

  async atualizarStatusAgendamento(id: number, barbeariaId: number, status: string) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: { id, barbeariaId },
      select: { id: true },
    });

    if (!agendamento) return null;

    return this.prisma.agendamento.update({
      where: { id },
      data: { status },
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true } },
        profissional: { select: { id: true, nome: true } },
        servicos: { select: { id: true, nome: true, preco: true, qtdeSlots: true } },
      },
    });
  }

  async listarFinanceiro(barbeariaId: number, inicio: string, fim: string) {
    const periodo = this.intervaloPeriodo(inicio, fim);
    const lancamentos = await this.prisma.lancamentoFinanceiro.findMany({
      where: { barbeariaId, data: { gte: periodo.inicio, lte: periodo.fim } },
      include: {
        profissional: { select: { id: true, nome: true } },
        usuario: { select: { id: true, nome: true } },
      },
      orderBy: { data: 'desc' },
    });

    return lancamentos.map((lancamento) => ({
      ...lancamento,
      valor: Number(lancamento.valor),
    }));
  }

  async criarLancamento(barbeariaId: number, dados: any) {
    return this.prisma.lancamentoFinanceiro.create({
      data: {
        barbeariaId,
        tipo: dados.tipo,
        descricao: dados.descricao,
        categoria: dados.categoria || null,
        valor: Number(dados.valor),
        data: new Date(dados.data),
        profissionalId: dados.profissionalId ? Number(dados.profissionalId) : null,
        usuarioId: dados.usuarioId ? Number(dados.usuarioId) : null,
      },
    });
  }

  async excluirLancamento(id: number, barbeariaId: number) {
    const lancamento = await this.prisma.lancamentoFinanceiro.findFirst({
      where: { id, barbeariaId },
      select: { id: true },
    });

    if (!lancamento) return null;
    return this.prisma.lancamentoFinanceiro.delete({ where: { id } });
  }

  async relatorios(barbeariaId: number, inicioParam: string, fimParam: string) {
    const { inicio, fim } = this.intervaloPeriodo(inicioParam, fimParam);
    const [lancamentos, agendamentos] = await Promise.all([
      this.prisma.lancamentoFinanceiro.findMany({
        where: { barbeariaId, data: { gte: inicio, lte: fim } },
      }),
      this.prisma.agendamento.findMany({
        where: { barbeariaId, data: { gte: inicio, lte: fim } },
        include: {
          profissional: { select: { id: true, nome: true } },
          servicos: { select: { id: true, nome: true, preco: true } },
        },
      }),
    ]);

    const receitasManuais = lancamentos
      .filter((lancamento) => lancamento.tipo === 'RECEITA')
      .reduce((total, lancamento) => total + Number(lancamento.valor), 0);
    const despesas = lancamentos
      .filter((lancamento) => lancamento.tipo === 'DESPESA')
      .reduce((total, lancamento) => total + Number(lancamento.valor), 0);
    const atendidos = agendamentos.filter((agendamento) =>
      STATUS_ATENDIDOS.includes(agendamento.status),
    );
    const receitaAgendamentos = atendidos.reduce(
      (total, agendamento) => total + this.valorAgendamento(agendamento),
      0,
    );

    return {
      periodo: { inicio: inicioParam, fim: fimParam },
      totais: {
        agendamentos: agendamentos.length,
        atendimentosConcluidos: atendidos.length,
        receitas: receitasManuais + receitaAgendamentos,
        despesas,
        saldo: receitasManuais + receitaAgendamentos - despesas,
      },
      comissoes: this.comissoes(atendidos),
      servicos: this.servicosMaisVendidos(atendidos),
    };
  }

  private async somarReceitas(barbeariaId: number, inicio: Date, fim: Date) {
    const [manual, agendamentos] = await Promise.all([
      this.somarLancamentos(barbeariaId, 'RECEITA', inicio, fim),
      this.prisma.agendamento.findMany({
        where: { barbeariaId, status: { in: STATUS_ATENDIDOS }, data: { gte: inicio, lte: fim } },
        include: { servicos: { select: { preco: true } } },
      }),
    ]);

    return manual + agendamentos.reduce(
      (total, agendamento) => total + this.valorAgendamento(agendamento),
      0,
    );
  }

  private async somarLancamentos(
    barbeariaId: number,
    tipo: 'RECEITA' | 'DESPESA',
    inicio: Date,
    fim: Date,
  ) {
    const soma = await this.prisma.lancamentoFinanceiro.aggregate({
      where: { barbeariaId, tipo, data: { gte: inicio, lte: fim } },
      _sum: { valor: true },
    });

    return Number(soma._sum.valor ?? 0);
  }

  private normalizarAgendamento(agendamento: any) {
    return {
      ...agendamento,
      valorTotal: this.valorAgendamento(agendamento),
      servicos: agendamento.servicos.map((servico: any) => ({
        ...servico,
        preco: Number(servico.preco),
      })),
    };
  }

  private valorAgendamento(agendamento: any) {
    const valorTotal = Number(agendamento.valorTotal ?? 0);
    if (valorTotal > 0) return valorTotal;

    return agendamento.servicos.reduce(
      (total: number, servico: any) => total + Number(servico.preco),
      0,
    );
  }

  private comissoes(agendamentos: any[]) {
    const porProfissional = new Map<number, any>();

    agendamentos.forEach((agendamento) => {
      const profissional = agendamento.profissional;
      const atual = porProfissional.get(profissional.id) ?? {
        profissionalId: profissional.id,
        profissional: profissional.nome,
        receita: 0,
        percentual: PERCENTUAL_COMISSAO_PADRAO,
        comissao: 0,
      };
      atual.receita += this.valorAgendamento(agendamento);
      atual.comissao = (atual.receita * PERCENTUAL_COMISSAO_PADRAO) / 100;
      porProfissional.set(profissional.id, atual);
    });

    return Array.from(porProfissional.values());
  }

  private servicosMaisVendidos(agendamentos: any[]) {
    const porServico = new Map<number, any>();

    agendamentos.forEach((agendamento) => {
      agendamento.servicos.forEach((servico: any) => {
        const atual = porServico.get(servico.id) ?? {
          servicoId: servico.id,
          servico: servico.nome,
          quantidade: 0,
          receita: 0,
        };
        atual.quantidade += 1;
        atual.receita += Number(servico.preco);
        porServico.set(servico.id, atual);
      });
    });

    return Array.from(porServico.values()).sort((a, b) => b.quantidade - a.quantidade);
  }

  private intervaloDia(data: string) {
    return this.intervaloPeriodo(data, data);
  }

  private intervaloPeriodo(inicio: string, fim: string) {
    return {
      inicio: new Date(`${inicio}T00:00:00.000Z`),
      fim: new Date(`${fim}T23:59:59.999Z`),
    };
  }
}
