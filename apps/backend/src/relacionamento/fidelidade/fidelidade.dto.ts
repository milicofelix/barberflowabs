import { BadRequestException } from '@nestjs/common';

export interface NivelFidelidade { nome: string; pontos: number }
export interface ProgramaDto { ativo: boolean; centavosPorPonto: number; validadeDias: number; bonusIndicacao: number; minimoIndicacaoCentavos: number; niveis: NivelFidelidade[] }
export interface RecompensaDto { nome: string; pontos: number; descontoCentavos: number; ativo: boolean }
export interface ElegibilidadeCupom { tags?: string[]; servicoIds?: number[]; primeiraVisita?: boolean }
export interface CupomDto { codigo: string; descontoCentavos: number; inicio: string; fim: string; limiteTotal: number; limitePorCliente: number; minimoCentavos: number; elegibilidade?: ElegibilidadeCupom; ativo: boolean }
export interface AplicarBeneficioDto { chaveIdempotencia: string; recompensaId?: number; codigoCupom?: string }

export function inteiro(valor: unknown, minimo = 1, maximo = 2147483647): number {
  if (typeof valor !== 'number' || !Number.isSafeInteger(valor) || valor < minimo || valor > maximo) throw new BadRequestException(`Informe inteiro entre ${minimo} e ${maximo}`);
  return valor;
}
export function idFidelidade(valor: string) { return inteiro(/^\d+$/.test(valor) ? Number(valor) : NaN); }
export function texto(valor: unknown, maximo: number): string {
  if (typeof valor !== 'string' || !valor.trim() || valor.length > maximo) throw new BadRequestException(`Texto obrigatório, até ${maximo} caracteres`);
  return valor.trim();
}
function booleano(valor: unknown) { if (typeof valor !== 'boolean') throw new BadRequestException('Informe verdadeiro ou falso'); return valor; }
export function validarPrograma(d: ProgramaDto) {
  if (!d) throw new BadRequestException('Programa obrigatório');
  if (!Array.isArray(d.niveis) || !d.niveis.length || d.niveis.length > 10) throw new BadRequestException('Informe de um a dez níveis');
  const niveis = d.niveis.map((n) => ({ nome: texto(n?.nome, 60), pontos: inteiro(n?.pontos, 0) })).sort((a, b) => a.pontos - b.pontos);
  if (niveis[0].pontos !== 0 || new Set(niveis.map((n) => n.pontos)).size !== niveis.length || new Set(niveis.map((n) => n.nome)).size !== niveis.length) throw new BadRequestException('Níveis devem começar em zero e ter nomes e pontuações únicos');
  return { ativo: booleano(d.ativo), centavosPorPonto: inteiro(d.centavosPorPonto), validadeDias: inteiro(d.validadeDias, 1, 3650), bonusIndicacao: inteiro(d.bonusIndicacao, 0, 1000000), minimoIndicacaoCentavos: inteiro(d.minimoIndicacaoCentavos, 0), niveis };
}
export function validarRecompensa(d: RecompensaDto) {
  return { nome: texto(d?.nome, 120), pontos: inteiro(d?.pontos), descontoCentavos: inteiro(d?.descontoCentavos), ativo: booleano(d?.ativo) };
}
export function validarCupom(d: CupomDto) {
  const codigo = texto(d?.codigo, 40).toUpperCase();
  if (!/^[A-Z0-9_-]+$/.test(codigo)) throw new BadRequestException('Código de cupom inválido');
  const inicio = new Date(d.inicio); const fim = new Date(d.fim);
  if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fim.getTime()) || inicio >= fim || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(d.inicio) || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(d.fim)) throw new BadRequestException('Período inválido; informe datas ISO com fuso');
  const e = d.elegibilidade ?? {};
  if (typeof e !== 'object' || Array.isArray(e) || Object.keys(e).some((k) => !['tags', 'servicoIds', 'primeiraVisita'].includes(k))) throw new BadRequestException('Elegibilidade inválida');
  if (e.tags !== undefined && (!Array.isArray(e.tags) || e.tags.length > 10)) throw new BadRequestException('Informe até dez tags');
  if (e.servicoIds !== undefined && (!Array.isArray(e.servicoIds) || e.servicoIds.length > 100)) throw new BadRequestException('Informe até cem serviços');
  const elegibilidade: ElegibilidadeCupom = {};
  if (e.tags) elegibilidade.tags = [...new Set(e.tags.map((t) => texto(t, 60)))];
  if (e.servicoIds) elegibilidade.servicoIds = [...new Set(e.servicoIds.map((id) => inteiro(id)))];
  if (e.primeiraVisita !== undefined) elegibilidade.primeiraVisita = booleano(e.primeiraVisita);
  return { codigo, inicio, fim, descontoCentavos: inteiro(d.descontoCentavos), limiteTotal: inteiro(d.limiteTotal), limitePorCliente: inteiro(d.limitePorCliente), minimoCentavos: inteiro(d.minimoCentavos, 0), elegibilidade, ativo: booleano(d.ativo) };
}

/** Snapshot monetário: não reinterpretar um desconto integral como valor legado ausente. */
export interface BaseValorFidelidade { valorTotal?: unknown; itens?: Array<{ preco: unknown }>; servicos?: Array<{ preco: unknown }> }
export function brutoCentavos(a: BaseValorFidelidade): number {
  const total = Number(a.valorTotal ?? 0);
  const itens = a.itens?.length ? a.itens : a.servicos ?? [];
  return Math.max(0, Math.round((total > 0 ? total : itens.reduce((s, i) => s + Number(i.preco), 0)) * 100));
}
export function liquidoCentavos(a: BaseValorFidelidade, desconto = 0) { return Math.max(0, brutoCentavos(a) - desconto); }
