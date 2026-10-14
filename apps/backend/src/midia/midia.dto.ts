export const FINALIDADES_MIDIA = ['AVATAR', 'SERVICO', 'PROFISSIONAL', 'CAPA'] as const;
export type FinalidadeMidia = typeof FINALIDADES_MIDIA[number];
export type EntidadeMidia = 'USUARIO' | 'SERVICO' | 'PROFISSIONAL' | 'ESTABELECIMENTO';
export interface AssociarMidiaDto { midiaId: string | null; entidade: EntidadeMidia; entidadeId?: number }
export interface VersaoMidia { url: string; largura: number; altura: number; bytes: number }
export interface RespostaMidia {
  id: string; titulo: string; finalidade: FinalidadeMidia; segmentoSlug: string | null
  versoes: Record<string, VersaoMidia>
}
export const LIMITE_UPLOAD = 5 * 1024 * 1024;
