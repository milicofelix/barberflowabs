import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { urlImagemProfissional } from '@uniflowabs/core';
import { PrismaService } from 'src/db/prisma.service';
import { PublicoPrisma } from './publico.prisma';

export type TipoCatalogoPublico = 'servicos' | 'profissionais';
export function filtrosCatalogoPublico(query: Record<string, unknown>) {
  const inteiro = (valor: unknown, padrao: number, max: number) => {
    if (valor === undefined) return padrao;
    if (typeof valor !== 'string' || !/^\d+$/.test(valor) || Number(valor) < 1 || Number(valor) > max) throw new BadRequestException('Paginação inválida');
    return Number(valor);
  };
  if (query.q !== undefined && (typeof query.q !== 'string' || query.q.length > 120)) throw new BadRequestException('Busca deve ter até 120 caracteres');
  if (query.segmento !== undefined && (typeof query.segmento !== 'string' || !/^[a-z0-9-]{1,80}$/.test(query.segmento))) throw new BadRequestException('Segmento inválido');
  if (query.vitrine !== undefined && query.vitrine !== 'true' && query.vitrine !== 'false') throw new BadRequestException('Modo de vitrine inválido');
  return { q: String(query.q ?? '').trim(), segmento: String(query.segmento ?? ''), pagina: inteiro(query.pagina, 1, 1000), limite: inteiro(query.limite, 12, 24), vitrine: query.vitrine === 'true' };
}

@Injectable()
export class CatalogoPublicoPrisma {
  constructor(private readonly prisma: PrismaService, private readonly publico: PublicoPrisma) {}

  segmentos() {
    return this.prisma.segmento.findMany({ where: { ativo: true }, select: { slug: true, nome: true }, orderBy: { nome: 'asc' }, take: 100 });
  }

  async listar(tipo: TipoCatalogoPublico, query: Record<string, unknown>, sortear: (maximo: number) => number = randomInt) {
    const filtro = filtrosCatalogoPublico(query);
    const classificacao = filtro.segmento ? { segmentos: { some: { segmento: { slug: filtro.segmento, ativo: true } } } } : {};
    const estabelecimento = { AND: [this.publico.criteriosPublicacao(), classificacao] };
    const habilitacao = tipo === 'servicos' ? { profissionaisHabilitados: { some: { ativo: true } } } : { servicosHabilitados: { some: { ativo: true } } };
    const busca = filtro.q ? { OR: [{ nome: { contains: filtro.q } }, { descricao: { contains: filtro.q } }, { estabelecimento: { OR: [{ nome: { contains: filtro.q } }, { nomePublico: { contains: filtro.q } }] } }] } : {};
    const where = { ...habilitacao, ...busca, estabelecimento };
    // Adaptador comum somente para leitura; selects são explicitamente separados por entidade.
    const modelo: any = tipo === 'servicos' ? this.prisma.servico : this.prisma.profissional;
    const base = { id: true, nome: true, descricao: true, imagemURL: true, estabelecimento: { select: { id: true, nome: true, nomePublico: true, slug: true } } };
    const select = tipo === 'servicos' ? { ...base, preco: true, qtdeSlots: true, duracaoMinutos: true } : { ...base, sexo: true, avaliacao: true, quantidadeAvaliacoes: true };
    let itens: any[];
    let total: number;
    const limite = filtro.vitrine ? 6 : filtro.limite;
    if (filtro.vitrine) {
      // No máximo seis unidades e seis candidatos por unidade; nunca carrega o catálogo inteiro.
      const relacao = tipo === 'servicos' ? 'servicos' : 'profissionais';
      const unidadesWhere = { AND: [estabelecimento, { [relacao]: { some: { ...habilitacao, ...busca } } }] };
      const unidadesTotal = await this.prisma.estabelecimento.count({ where: unidadesWhere });
      const inicio = unidadesTotal ? sortear(unidadesTotal) : 0;
      const unidades = await this.prisma.estabelecimento.findMany({ where: unidadesWhere, orderBy: { id: 'asc' }, skip: inicio, take: 6, select: { id: true } });
      if (unidades.length < Math.min(6, unidadesTotal)) unidades.push(...await this.prisma.estabelecimento.findMany({ where: unidadesWhere, orderBy: { id: 'asc' }, take: Math.min(6, unidadesTotal) - unidades.length, select: { id: true } }));
      const unidadesUnicas = Array.from(new Map(unidades.map((unidade) => [unidade.id, unidade])).values());
      const grupos = await Promise.all(unidadesUnicas.map(async (unidade) => {
        const filtroUnidade = { ...where, estabelecimentoId: unidade.id };
        const quantidade = await modelo.count({ where: filtroUnidade });
        const deslocamento = quantidade ? sortear(quantidade) : 0;
        const candidatos = await modelo.findMany({ where: filtroUnidade, orderBy: [{ nome: 'asc' }, { id: 'asc' }], skip: deslocamento, take: 6, select });
        if (candidatos.length < Math.min(6, quantidade)) candidatos.push(...await modelo.findMany({ where: filtroUnidade, orderBy: [{ nome: 'asc' }, { id: 'asc' }], take: Math.min(6, quantidade) - candidatos.length, select }));
        return Array.from(new Map(candidatos.map((item: any) => [item.id, item])).values()) as any[];
      }));
      itens = [];
      for (let posicao = 0; posicao < 6 && itens.length < 6; posicao++) for (const grupo of grupos) if (grupo[posicao] && itens.length < 6) itens.push(grupo[posicao]);
      total = itens.length;
    } else {
      [itens, total] = await Promise.all([modelo.findMany({ where, orderBy: [{ nome: 'asc' }, { id: 'asc' }], skip: (filtro.pagina - 1) * limite, take: limite, select }), modelo.count({ where })]);
    }
    return {
      itens: itens.map((item) => ({ ...item, ...(tipo === 'servicos' ? { preco: Number(item.preco) } : { imagemURL: urlImagemProfissional(item.imagemURL, item.sexo) }), estabelecimento: { id: item.estabelecimento.id, slug: item.estabelecimento.slug, nome: item.estabelecimento.nomePublico || item.estabelecimento.nome } })),
      paginacao: { pagina: filtro.vitrine ? 1 : filtro.pagina, limite, total, paginas: Math.ceil(total / limite) },
    };
  }
}
