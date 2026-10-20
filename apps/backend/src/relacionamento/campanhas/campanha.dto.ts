import { BadRequestException } from '@nestjs/common';
export interface FiltrosCampanha {
  tags?: string[]; unidadeId?: number; servicoId?: number; profissionalId?: number;
  recorrenciaMinima?: number; inatividadeDias?: number;
}
export interface SalvarCampanhaDto { nome: string; templateId: number; filtros?: FiltrosCampanha; intervaloMinimoHoras?: number }
export function validarCampanha(dados: SalvarCampanhaDto) {
  if (typeof dados?.nome !== 'string' || !dados.nome.trim() || dados.nome.length > 150) throw new BadRequestException('Nome obrigatório, até 150 caracteres');
  inteiroCampanha(dados.templateId, 1, 2147483647);
  const filtros = dados.filtros ?? {};
  if (!filtros || typeof filtros !== 'object' || Array.isArray(filtros)) throw new BadRequestException('Filtros inválidos');
  const permitidos = ['tags', 'unidadeId', 'servicoId', 'profissionalId', 'recorrenciaMinima', 'inatividadeDias'];
  if (Object.keys(filtros).some((chave) => !permitidos.includes(chave))) throw new BadRequestException('Filtro não suportado');
  if (filtros.tags !== undefined && (!Array.isArray(filtros.tags) || filtros.tags.length > 10 || filtros.tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag.length > 60))) throw new BadRequestException('Informe até dez tags válidas');
  for (const chave of ['unidadeId', 'servicoId', 'profissionalId'] as const) if (filtros[chave] !== undefined) inteiroCampanha(filtros[chave], 1, 2147483647);
  if (filtros.recorrenciaMinima !== undefined) inteiroCampanha(filtros.recorrenciaMinima, 1, 1000);
  if (filtros.inatividadeDias !== undefined) inteiroCampanha(filtros.inatividadeDias, 1, 3650);
  const intervaloMinimoHoras = dados.intervaloMinimoHoras ?? 168;
  inteiroCampanha(intervaloMinimoHoras, 24, 720);
  return { nome: dados.nome.trim(), templateId: dados.templateId, intervaloMinimoHoras, filtros: { ...filtros, ...(filtros.tags ? { tags: [...new Set(filtros.tags.map((tag) => tag.trim()))] } : {}) } };
}
export function inteiroCampanha(valor: unknown, min = 1, max = 100) {
  if (typeof valor !== 'number' || !Number.isSafeInteger(valor) || valor < min || valor > max) throw new BadRequestException(`Número inteiro esperado entre ${min} e ${max}`);
  return valor;
}
export function paginacaoCampanha(pagina?: string, limite?: string) {
  const ler = (valor: string | undefined, padrao: number, max: number) => {
    if (valor === undefined) return padrao;
    if (typeof valor !== 'string' || !/^\d+$/.test(valor)) throw new BadRequestException('Paginação inválida');
    return inteiroCampanha(Number(valor), 1, max);
  };
  return { pagina: ler(pagina, 1, 10000), limite: ler(limite, 25, 100) };
}
export const STATUS_ENVIO_PENDENTE_CAMPANHA = ['AGENDADO', 'RETENTATIVA', 'PROCESSANDO'];
