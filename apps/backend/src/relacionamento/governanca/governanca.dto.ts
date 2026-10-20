import { BadRequestException } from '@nestjs/common';
import { inteiro, texto } from '../fidelidade/fidelidade.dto';

export interface PeriodoMetricas { inicio: Date; fim: Date; campanhaId: number | null }
export function periodoMetricas(inicio?: string, fim?: string, campanha?: string): PeriodoMetricas {
  const data = (s: string) => { if (typeof s !== 'string' || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(s) || !Number.isFinite(new Date(s).getTime())) throw new BadRequestException('Informe início/fim ISO com fuso'); return new Date(s); };
  const a = data(inicio); const b = data(fim);
  if (a >= b || b.getTime() - a.getTime() > 93 * 86400000) throw new BadRequestException('Período deve ter no máximo 93 dias, com fim exclusivo');
  return { inicio: a, fim: b, campanhaId: campanha === undefined ? null : inteiro(/^\d+$/.test(campanha) ? Number(campanha) : NaN) };
}
export function cursorGovernanca(cursor?: string) { return cursor === undefined ? 0 : inteiro(/^\d+$/.test(cursor) ? Number(cursor) : NaN, 0); }
export function validarPolitica(d: { ativa: boolean; conteudoDias: number; fundamento: string }) {
  if (typeof d?.ativa !== 'boolean') throw new BadRequestException('Ativação da política inválida');
  return { ativa: d.ativa, conteudoDias: inteiro(d.conteudoDias, 1, 3650), fundamento: texto(d.fundamento, 500) };
}
export function numeroBanco(valor: unknown) { return Number(valor ?? 0); }
export function taxa(numerador: number, denominador: number) { return denominador ? Math.round(numerador / denominador * 10000) / 100 : null; }
export function confirmarAcao(valor: unknown, esperado: string) { if (valor !== esperado) throw new BadRequestException(`Confirmação obrigatória: ${esperado}`); }
