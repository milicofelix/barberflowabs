import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/db/prisma.service';
import { MarketplaceFiltrosDto } from './marketplace.dto';
import { PublicoPrisma } from './publico.prisma';

const STATUS_ATIVOS = ['AGENDADO', 'CONFIRMADO', 'CHECKIN'];

@Injectable()
export class MarketplacePrisma {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publico: PublicoPrisma,
  ) {}

  async listar(filtros: MarketplaceFiltrosDto) {
    const estabelecimentos = await this.publico.listarEstabelecimentos(filtros);
    const data = this.dataOpcional(filtros.disponivelEm);
    const filtrados = [];

    for (const estabelecimento of estabelecimentos) {
      const servicos = this.filtrarServicos(estabelecimento.servicos, filtros);
      if (!servicos.length || !this.correspondeClassificacao(estabelecimento, filtros)) continue;
      if (data && !(await this.temProfissionalDisponivel(estabelecimento.id, servicos, data))) continue;
      filtrados.push({
        ...estabelecimento,
        servicos,
        precoInicial: Math.min(...servicos.map((servico: any) => Number(servico.preco))),
        disponivelEm: data?.toISOString() ?? null,
      });
    }

    this.ordenar(filtrados, filtros.ordenarPor);
    const pagina = this.inteiro(filtros.pagina, 1, 1, 10_000);
    const limite = this.inteiro(filtros.limite, 20, 1, 50);
    const inicio = (pagina - 1) * limite;
    return {
      itens: filtrados.slice(inicio, inicio + limite),
      paginacao: { pagina, limite, total: filtrados.length, paginas: Math.ceil(filtrados.length / limite) },
    };
  }

  listarCategorias() {
    return (this.prisma as any).segmento.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        slug: true,
        nome: true,
        descricao: true,
        especialidades: {
          where: { ativo: true },
          orderBy: { nome: 'asc' },
          select: { id: true, slug: true, nome: true, descricao: true },
        },
      },
    });
  }

  private filtrarServicos(servicos: any[], filtros: MarketplaceFiltrosDto) {
    const minimo = this.numero(filtros.precoMin);
    const maximo = this.numero(filtros.precoMax);
    const especialidade = filtros.especialidade?.trim().toLowerCase();
    return servicos.filter((servico) => {
      const preco = Number(servico.preco);
      const correspondeEspecialidade = !especialidade || servico.especialidades?.some((item: any) =>
        item.slug?.toLowerCase() === especialidade || item.nome?.toLowerCase().includes(especialidade),
      );
      return correspondeEspecialidade && (minimo === null || preco >= minimo) && (maximo === null || preco <= maximo);
    });
  }

  private correspondeClassificacao(estabelecimento: any, filtros: MarketplaceFiltrosDto) {
    const segmento = filtros.segmento?.trim().toLowerCase();
    const especialidade = filtros.especialidade?.trim().toLowerCase();
    const segmentos = estabelecimento.segmentos ?? [];
    const especialidades = estabelecimento.especialidades ?? [];
    const segmentoOk = !segmento || segmentos.some((item: any) =>
      item.slug?.toLowerCase() === segmento || item.nome?.toLowerCase().includes(segmento),
    );
    const especialidadeOk = !especialidade || especialidades.some((item: any) =>
      item.slug?.toLowerCase() === especialidade || item.nome?.toLowerCase().includes(especialidade),
    );
    const nota = this.numero(filtros.notaMin);
    return segmentoOk && especialidadeOk && (nota === null || Number(estabelecimento.avaliacaoMedia ?? 0) >= nota);
  }

  private async temProfissionalDisponivel(estabelecimentoId: number, servicos: any[], inicio: Date) {
    const duracao = Math.min(...servicos.map((servico) => Number(servico.duracaoMinutos ?? 15)));
    const fim = new Date(inicio.getTime() + duracao * 60_000);
    const vinculos = await (this.prisma as any).profissionalServico.findMany({
      where: { estabelecimentoId, servicoId: { in: servicos.map((servico) => servico.id) }, ativo: true },
      select: { profissionalId: true },
    });
    const profissionais = [...new Set<number>(vinculos.map((vinculo: any) => vinculo.profissionalId))];
    if (!profissionais.length) return false;
    const ocupados = await (this.prisma as any).agendamento.findMany({
      where: {
        estabelecimentoId,
        profissionalId: { in: profissionais },
        status: { in: STATUS_ATIVOS },
        inicioOcupacao: { lt: fim },
        fimOcupacao: { gt: inicio },
      },
      select: { profissionalId: true },
    });
    const idsOcupados = new Set(ocupados.map((item: any) => item.profissionalId));
    return profissionais.some((id) => !idsOcupados.has(id));
  }

  private ordenar(itens: any[], ordem?: string) {
    if (ordem === 'PRECO') itens.sort((a, b) => a.precoInicial - b.precoInicial);
    if (ordem === 'AVALIACAO') itens.sort((a, b) => Number(b.avaliacaoMedia ?? 0) - Number(a.avaliacaoMedia ?? 0));
    if (ordem === 'DISTANCIA') itens.sort((a, b) => Number(a.distanciaKm ?? Infinity) - Number(b.distanciaKm ?? Infinity));
  }

  private dataOpcional(valor?: string) {
    if (!valor) return null;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime()) || data.getTime() <= Date.now()) {
      throw new BadRequestException('Disponibilidade deve ser uma data futura válida');
    }
    return data;
  }

  private numero(valor?: string) {
    if (valor === undefined || valor === '') return null;
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0) throw new BadRequestException('Filtro numérico inválido');
    return numero;
  }

  private inteiro(valor: string | undefined, padrao: number, minimo: number, maximo: number) {
    const numero = valor === undefined ? padrao : Number(valor);
    if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
      throw new BadRequestException('Paginação inválida');
    }
    return numero;
  }
}
