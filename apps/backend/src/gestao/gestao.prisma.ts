import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { randomUUID } from 'crypto';

const STATUS_ATENDIDOS = ['CONCLUIDO'];
const PERCENTUAL_COMISSAO_PADRAO = 40;
const DIAS_RETORNO_RISCO = 45;
const DIAS_ANIVERSARIO = 30;
const TRANSICOES_AGENDAMENTO: Record<string, string[]> = {
  AGENDADO: ['CONFIRMADO', 'CANCELADO', 'NO_SHOW'],
  CONFIRMADO: ['CHECKIN', 'CANCELADO', 'NO_SHOW'],
  CHECKIN: ['CONCLUIDO', 'CANCELADO', 'NO_SHOW'],
  CONCLUIDO: [], CANCELADO: [], NO_SHOW: [],
};

@Injectable()
export class GestaoPrisma {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(estabelecimentoId: number) {
    const hoje = new Date().toISOString().slice(0, 10);
    const { inicio, fim } = this.intervaloDia(hoje);
    const inicioMes = new Date(inicio);
    inicioMes.setUTCDate(1);
    inicioMes.setUTCHours(0, 0, 0, 0);

    const [agendamentosHoje, clientes, receitaHoje, receitaMes, despesasMes] =
      await Promise.all([
        this.prisma.agendamento.count({
          where: { estabelecimentoId, data: { gte: inicio, lte: fim } },
        }),
        (this.prisma as any).clienteEstabelecimento.count({ where: { estabelecimentoId } }),
        this.somarReceitas(estabelecimentoId, inicio, fim),
        this.somarReceitas(estabelecimentoId, inicioMes, fim),
        this.somarLancamentos(estabelecimentoId, 'DESPESA', inicioMes, fim),
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

  async listarClientes(estabelecimentoId: number) {
    const clientes = await (this.prisma as any).clienteEstabelecimento.findMany({
      where: { estabelecimentoId },
      select: {
        id: true,
        primeiroAgendamentoEm: true,
        ultimoAgendamentoEm: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            emailTecnico: true,
            telefone: true,
            dataNascimento: true,
            membroEstabelecimento: true,
            papel: true,
          },
        },
      },
      orderBy: { usuario: { nome: 'asc' } },
    });

    return Promise.all(
      clientes.map(async (relacao: any) => {
        const totalAgendamentos = await this.prisma.agendamento.count({
          where: { estabelecimentoId, usuarioId: relacao.usuario.id },
        });

        return {
          id: relacao.usuario.id,
          relacaoId: relacao.id,
          nome: relacao.usuario.nome,
          email: relacao.usuario.emailTecnico ? null : relacao.usuario.email,
          telefone: relacao.usuario.telefone,
          dataNascimento: relacao.usuario.dataNascimento?.toISOString().slice(0, 10) ?? null,
          cadastroOperacional: relacao.usuario.membroEstabelecimento || relacao.usuario.papel === 'ESTABLISHMENT_MEMBER' || relacao.usuario.papel === 'SUPER_ADMIN',
          primeiroAgendamentoEm: relacao.primeiroAgendamentoEm,
          ultimoAgendamentoEm: relacao.ultimoAgendamentoEm,
          totalAgendamentos,
        };
      }),
    );
  }

  async historicoCliente(id: number, estabelecimentoId: number) {
    const relacao = await (this.prisma as any).clienteEstabelecimento.findUnique({
      where: { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId: id } },
      select: { id: true, usuario: { select: { membroEstabelecimento: true, papel: true } } },
    });

    if (!relacao) return null;

    if (relacao.usuario.membroEstabelecimento || relacao.usuario.papel === 'ESTABLISHMENT_MEMBER' || relacao.usuario.papel === 'SUPER_ADMIN') {
      throw new Error('Este cliente possui cadastro operacional e deve editar seus dados na própria conta');
    }

    const cliente = await this.prisma.usuario.findFirst({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        dataNascimento: true,
        agendamentos: {
          where: { estabelecimentoId },
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
      dataNascimento: cliente.dataNascimento?.toISOString().slice(0, 10) ?? null,
      agendamentos: cliente.agendamentos.map((agendamento) =>
        this.normalizarAgendamento(agendamento),
      ),
    };
  }

  async criarCliente(estabelecimentoId: number, dados: any) {
    const dataNascimento = dados.dataNascimento ? new Date(`${dados.dataNascimento}T00:00:00.000Z`) : null;
    const emailContato = dados.email?.trim().toLowerCase() || null;
    const telefoneNormalizado = this.normalizarTelefone(dados.telefone);
    const existente = emailContato ? await (this.prisma as any).usuario.findUnique({
      where: { email: emailContato },
      select: { id: true, nome: true, email: true, emailTecnico: true, telefone: true, dataNascimento: true, membroEstabelecimento: true },
    }) : await (this.prisma as any).usuario.findFirst({
      where: { OR: [{ telefoneNormalizado }, { telefone: telefoneNormalizado }] },
      select: { id: true, nome: true, email: true, emailTecnico: true, telefone: true, dataNascimento: true, membroEstabelecimento: true },
    });

    const cliente = existente ?? (await (this.prisma as any).usuario.create({
      data: {
        estabelecimentoId: null,
        nome: dados.nome,
        email: emailContato ?? `contato+${randomUUID()}@interno.uniflowabs.invalid`,
        emailContato,
        emailTecnico: !emailContato,
        telefone: telefoneNormalizado,
        telefoneNormalizado,
        dataNascimento,
        senha: dados.senha,
        membroEstabelecimento: false,
        papel: 'CUSTOMER',
      },
      select: { id: true, nome: true, email: true, emailTecnico: true, telefone: true, dataNascimento: true, membroEstabelecimento: true },
    }));

    await (this.prisma as any).clienteEstabelecimento.upsert({
      where: { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId: cliente.id } },
      update: {},
      create: {
        estabelecimentoId,
        usuarioId: cliente.id,
        origem: 'GESTAO',
      },
    });

    return {
      ...cliente,
      email: emailContato ?? (existente && !cliente.emailTecnico ? cliente.email : null),
      emailTecnico: undefined,
      membroEstabelecimento: undefined,
      dataNascimento: cliente.dataNascimento?.toISOString().slice(0, 10) ?? null,
      totalAgendamentos: 0,
    };
  }

  async atualizarCliente(id: number, estabelecimentoId: number, dados: any) {
    const relacao = await (this.prisma as any).clienteEstabelecimento.findUnique({
      where: { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId: id } },
      select: { id: true },
    });

    if (!relacao) return null;

    const emailContato = dados.email?.trim().toLowerCase() || null;
    const telefoneNormalizado = this.normalizarTelefone(dados.telefone);
    const atual = await (this.prisma as any).usuario.findUnique({ where: { id }, select: { emailTecnico: true } });
    const atualizado = await (this.prisma as any).usuario.update({
      where: { id },
      data: {
        nome: dados.nome,
        ...(emailContato ? { email: emailContato, emailContato, emailTecnico: false } : atual?.emailTecnico ? { emailContato: null } : {}),
        telefone: telefoneNormalizado,
        telefoneNormalizado,
        dataNascimento: dados.dataNascimento ? new Date(`${dados.dataNascimento}T00:00:00.000Z`) : null,
        ...(dados.senha ? { senha: dados.senha } : {}),
      },
      select: { id: true, nome: true, email: true, telefone: true, dataNascimento: true },
    });

    return {
      ...atualizado,
      dataNascimento: atualizado.dataNascimento?.toISOString().slice(0, 10) ?? null,
    };
  }

  async excluirCliente(id: number, estabelecimentoId: number) {
    const cliente = await (this.prisma as any).clienteEstabelecimento.findUnique({
      where: { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId: id } },
      select: { id: true },
    });

    if (!cliente) return null;
    return (this.prisma as any).$transaction(async (tx: any) => {
      await tx.preferenciaComunicacao.deleteMany({ where: { estabelecimentoId, usuarioId: id } });
      await tx.importacaoContatoItem.updateMany({
        where: { usuarioId: id, lote: { estabelecimentoId } },
        data: { usuarioId: null },
      });
      return tx.clienteEstabelecimento.delete({
        where: { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId: id } },
        select: { id: true },
      });
    });
  }

  async listarAgendamentos(estabelecimentoId: number, data: string) {
    const { inicio, fim } = this.intervaloDia(data);
    const agendamentos = await this.prisma.agendamento.findMany({
      where: { estabelecimentoId, data: { gte: inicio, lte: fim } },
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true } },
        profissional: { select: { id: true, nome: true } },
        servicos: { select: { id: true, nome: true, preco: true, qtdeSlots: true } },
      },
      orderBy: { data: 'asc' },
    });

    return agendamentos.map((agendamento) => this.normalizarAgendamento(agendamento));
  }

  async listarAgendamentosFuturos(estabelecimentoId: number) {
    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        estabelecimentoId,
        status: { in: ['AGENDADO', 'CONFIRMADO', 'CHECKIN'] },
        OR: [{ fimOcupacao: { gt: new Date() } }, { fimOcupacao: null, data: { gt: new Date() } }],
      },
      include: {
        usuario: { select: { id: true, nome: true, telefone: true } },
        profissional: { select: { id: true, nome: true } },
        servicos: { select: { id: true, nome: true, preco: true, qtdeSlots: true } },
      },
      orderBy: { data: 'asc' },
      take: 30,
    });
    return agendamentos.map((agendamento) => this.normalizarAgendamento(agendamento));
  }

  listarClientesParaAgendamento(estabelecimentoId: number, busca?: string) {
    const termo = busca?.trim();
    return (this.prisma as any).clienteEstabelecimento.findMany({
      where: {
        estabelecimentoId,
        status: 'ATIVO',
        ...(termo ? { usuario: { OR: [
          { nome: { contains: termo } },
          { email: { contains: termo } },
          { telefone: { contains: termo } },
        ] } } : {}),
      },
      select: { usuario: { select: { id: true, nome: true, telefone: true, email: true, emailTecnico: true } } },
      orderBy: { usuario: { nome: 'asc' } },
      take: termo ? 30 : 8,
    }).then((itens: any[]) => itens.map((item) => ({
      id: item.usuario.id, nome: item.usuario.nome, telefone: item.usuario.telefone,
      email: item.usuario.emailTecnico ? null : item.usuario.email,
    })));
  }

  contextoAgendamentoAssistido(estabelecimentoId: number) {
    return (this.prisma as any).estabelecimento.findUnique({
      where: { id: estabelecimentoId },
      select: {
        id: true,
        modeloAtendimento: true,
        unidades: {
          where: { ativa: true },
          select: { id: true, nome: true, endereco: true },
          orderBy: { nome: 'asc' },
        },
        recursos: {
          where: { ativo: true },
          select: { id: true, nome: true, tipo: true, capacidade: true, unidadeId: true },
          orderBy: [{ tipo: 'asc' }, { nome: 'asc' }],
        },
      },
    });
  }

  obterClienteParaAgendamento(estabelecimentoId: number, usuarioId: number) {
    return (this.prisma as any).clienteEstabelecimento.findFirst({
      where: { estabelecimentoId, usuarioId, status: 'ATIVO' },
      select: { usuario: { select: { id: true, nome: true, email: true, telefone: true } } },
    }).then((item: any) => item?.usuario ?? null);
  }

  async atualizarStatusAgendamento(id: number, estabelecimentoId: number, status: string) {
    const agendamento = await this.prisma.agendamento.findFirst({
      where: { id, estabelecimentoId },
      select: { id: true, status: true, data: true },
    });

    if (!agendamento) return null;
    if (agendamento.status === status) return this.prisma.agendamento.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true } },
        profissional: { select: { id: true, nome: true } },
        servicos: { select: { id: true, nome: true, preco: true, qtdeSlots: true } },
      },
    });
    if (!(TRANSICOES_AGENDAMENTO[agendamento.status] ?? []).includes(status)) {
      throw new BadRequestException(`Não é possível alterar de ${agendamento.status} para ${status}`);
    }
    if (status === 'NO_SHOW' && agendamento.data.getTime() > Date.now()) {
      throw new BadRequestException('Ausência só pode ser registrada após o início do atendimento');
    }

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

  async listarFinanceiro(estabelecimentoId: number, inicio: string, fim: string) {
    const periodo = this.intervaloPeriodo(inicio, fim);
    const lancamentos = await this.prisma.lancamentoFinanceiro.findMany({
      where: { estabelecimentoId, data: { gte: periodo.inicio, lte: periodo.fim } },
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

  async criarLancamento(estabelecimentoId: number, dados: any) {
    return this.prisma.lancamentoFinanceiro.create({
      data: {
        estabelecimentoId,
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

  async excluirLancamento(id: number, estabelecimentoId: number) {
    const lancamento = await this.prisma.lancamentoFinanceiro.findFirst({
      where: { id, estabelecimentoId },
      select: { id: true },
    });

    if (!lancamento) return null;
    return this.prisma.lancamentoFinanceiro.delete({ where: { id } });
  }

  async relatorios(estabelecimentoId: number, inicioParam: string, fimParam: string) {
    const { inicio, fim } = this.intervaloPeriodo(inicioParam, fimParam);
    const [lancamentos, agendamentos] = await Promise.all([
      this.prisma.lancamentoFinanceiro.findMany({
        where: { estabelecimentoId, data: { gte: inicio, lte: fim } },
      }),
      this.prisma.agendamento.findMany({
        where: { estabelecimentoId, data: { gte: inicio, lte: fim } },
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

  async relacionamento(estabelecimentoId: number) {
    const agora = new Date();
    const limiteConfirmacao = this.somarDias(agora, 2);
    const limiteRetorno = this.somarDias(agora, -DIAS_RETORNO_RISCO);

    const [clientes, agendamentosConfirmacao, lembretes] = await Promise.all([
      (this.prisma as any).clienteEstabelecimento.findMany({
        where: { estabelecimentoId },
        select: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
              dataNascimento: true,
              agendamentos: {
                where: { estabelecimentoId, status: { in: STATUS_ATENDIDOS } },
                select: { id: true, data: true, status: true },
                orderBy: { data: 'desc' },
              },
            },
          },
        },
        orderBy: { usuario: { nome: 'asc' } },
      }),
      this.prisma.agendamento.findMany({
        where: {
          estabelecimentoId,
          status: 'AGENDADO',
          data: { gte: agora, lte: limiteConfirmacao },
        },
        include: {
          usuario: { select: { id: true, nome: true, telefone: true } },
          profissional: { select: { id: true, nome: true } },
          servicos: { select: { id: true, nome: true } },
        },
        orderBy: { data: 'asc' },
      }),
      this.prisma.lembreteRelacionamento.findMany({
        where: { estabelecimentoId, status: { in: ['PENDENTE', 'AGENDADO'] } },
        include: { usuario: { select: { id: true, nome: true, telefone: true } } },
        orderBy: { dataPrevista: 'asc' },
        take: 30,
      }),
    ]);

    const clientesRelacionamento = clientes.map((relacao: any) => relacao.usuario);

    const aniversariantes = clientesRelacionamento
      .filter((cliente) => cliente.dataNascimento)
      .map((cliente) => this.normalizarAniversariante(cliente, agora))
      .filter((cliente) => cliente.diasAteAniversario <= DIAS_ANIVERSARIO)
      .sort((a, b) => a.diasAteAniversario - b.diasAteAniversario);

    const clientesComAtendimento = clientesRelacionamento.filter((cliente) => cliente.agendamentos.length > 0);
    const clientesRecorrentes = clientesRelacionamento.filter((cliente) => cliente.agendamentos.length >= 2);
    const clientesSemRetorno = clientesComAtendimento
      .filter((cliente) => cliente.agendamentos[0].data < limiteRetorno)
      .map((cliente) => ({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        ultimoAtendimento: cliente.agendamentos[0].data,
        diasSemRetorno: this.diferencaDias(cliente.agendamentos[0].data, agora),
      }))
      .sort((a, b) => b.diasSemRetorno - a.diasSemRetorno);

    return {
      metricas: {
        totalClientes: clientesRelacionamento.length,
        clientesAtendidos: clientesComAtendimento.length,
        clientesRecorrentes: clientesRecorrentes.length,
        clientesSemRetorno: clientesSemRetorno.length,
        taxaRetorno: clientesComAtendimento.length
          ? Math.round((clientesRecorrentes.length / clientesComAtendimento.length) * 100)
          : 0,
      },
      aniversariantes,
      clientesSemRetorno,
      confirmacoesPendentes: agendamentosConfirmacao.map((agendamento) =>
        this.normalizarAgendamento(agendamento),
      ),
      lembretes: lembretes.map((lembrete) => ({
        ...lembrete,
        dataPrevista: lembrete.dataPrevista,
        enviadoEm: lembrete.enviadoEm,
      })),
      sugestoes: this.sugestoesRelacionamento(
        aniversariantes.length,
        clientesSemRetorno.length,
        agendamentosConfirmacao.length,
      ),
    };
  }

  async criarLembrete(estabelecimentoId: number, dados: any) {
    if (dados.usuarioId) {
      const cliente = await (this.prisma as any).clienteEstabelecimento.findUnique({
        where: { estabelecimentoId_usuarioId: { estabelecimentoId, usuarioId: Number(dados.usuarioId) } },
        select: { id: true },
      });
      if (!cliente) return null;
    }

    if (dados.agendamentoId) {
      const agendamento = await this.prisma.agendamento.findFirst({
        where: { id: Number(dados.agendamentoId), estabelecimentoId },
        select: { id: true },
      });
      if (!agendamento) return null;
    }

    return this.prisma.lembreteRelacionamento.create({
      data: {
        estabelecimentoId,
        usuarioId: dados.usuarioId ? Number(dados.usuarioId) : null,
        agendamentoId: dados.agendamentoId ? Number(dados.agendamentoId) : null,
        tipo: dados.tipo,
        canal: dados.canal || 'WHATSAPP',
        mensagem: dados.mensagem,
        dataPrevista: new Date(dados.dataPrevista),
      },
      include: { usuario: { select: { id: true, nome: true, telefone: true } } },
    });
  }

  async atualizarStatusLembrete(id: number, estabelecimentoId: number, status: string) {
    const lembrete = await this.prisma.lembreteRelacionamento.findFirst({
      where: { id, estabelecimentoId },
      select: { id: true },
    });

    if (!lembrete) return null;

    return this.prisma.lembreteRelacionamento.update({
      where: { id },
      data: {
        status,
        enviadoEm: status === 'ENVIADO' ? new Date() : null,
      },
      include: { usuario: { select: { id: true, nome: true, telefone: true } } },
    });
  }

  private async somarReceitas(estabelecimentoId: number, inicio: Date, fim: Date) {
    const [manual, agendamentos] = await Promise.all([
      this.somarLancamentos(estabelecimentoId, 'RECEITA', inicio, fim),
      this.prisma.agendamento.findMany({
        where: { estabelecimentoId, status: { in: STATUS_ATENDIDOS }, data: { gte: inicio, lte: fim } },
        include: { servicos: { select: { preco: true } } },
      }),
    ]);

    return manual + agendamentos.reduce(
      (total, agendamento) => total + this.valorAgendamento(agendamento),
      0,
    );
  }

  private async somarLancamentos(
    estabelecimentoId: number,
    tipo: 'RECEITA' | 'DESPESA',
    inicio: Date,
    fim: Date,
  ) {
    const soma = await this.prisma.lancamentoFinanceiro.aggregate({
      where: { estabelecimentoId, tipo, data: { gte: inicio, lte: fim } },
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

  private normalizarAniversariante(cliente: any, referencia: Date) {
    const nascimento = cliente.dataNascimento as Date;
    const proximo = new Date(Date.UTC(
      referencia.getUTCFullYear(),
      nascimento.getUTCMonth(),
      nascimento.getUTCDate(),
      12,
    ));

    if (proximo < referencia) {
      proximo.setUTCFullYear(proximo.getUTCFullYear() + 1);
    }

    return {
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      dataNascimento: nascimento.toISOString().slice(0, 10),
      proximoAniversario: proximo,
      diasAteAniversario: this.diferencaDias(referencia, proximo),
    };
  }

  private sugestoesRelacionamento(
    totalAniversariantes: number,
    totalSemRetorno: number,
    totalConfirmacoes: number,
  ) {
    const sugestoes = [];

    if (totalConfirmacoes > 0) {
      sugestoes.push({
        tipo: 'CONFIRMACAO',
        titulo: 'Confirmar horários próximos',
        descricao: `${totalConfirmacoes} agendamento(s) nas próximas 48 horas ainda estão como AGENDADO.`,
      });
    }

    if (totalAniversariantes > 0) {
      sugestoes.push({
        tipo: 'ANIVERSARIO',
        titulo: 'Criar campanha de aniversário',
        descricao: `${totalAniversariantes} cliente(s) fazem aniversário nos próximos ${DIAS_ANIVERSARIO} dias.`,
      });
    }

    if (totalSemRetorno > 0) {
      sugestoes.push({
        tipo: 'RETORNO',
        titulo: 'Recuperar clientes sem retorno',
        descricao: `${totalSemRetorno} cliente(s) não voltam há mais de ${DIAS_RETORNO_RISCO} dias.`,
      });
    }

    if (sugestoes.length === 0) {
      sugestoes.push({
        tipo: 'FIDELIDADE',
        titulo: 'Manter relacionamento ativo',
        descricao: 'A base está saudável. Considere criar lembretes periódicos para clientes recorrentes.',
      });
    }

    return sugestoes;
  }

  private somarDias(data: Date, dias: number) {
    const resultado = new Date(data);
    resultado.setUTCDate(resultado.getUTCDate() + dias);
    return resultado;
  }

  private diferencaDias(inicio: Date, fim: Date) {
    const dia = 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((fim.getTime() - inicio.getTime()) / dia));
  }

  private normalizarTelefone(valor?: string | null) {
    let digitos = String(valor ?? '').replace(/\D/g, '');
    if (!digitos) return null;
    if (digitos.startsWith('00')) digitos = digitos.slice(2);
    if ((digitos.length === 10 || digitos.length === 11) && !digitos.startsWith('55')) digitos = `55${digitos}`;
    return digitos.length >= 10 && digitos.length <= 15 ? `+${digitos}` : null;
  }
}
