export interface RetanguloAlvoTour { x: number; y: number; largura: number; altura: number }
export type MedirAlvoTour = (resultado: (retangulo: RetanguloAlvoTour | null) => void) => void

/** Registro local da tela. Não salva medidas, posição de scroll ou conteúdo do alvo. */
export class RegistroAlvosTour {
    private alvos = new Map<string, MedirAlvoTour>()
    private ouvintes = new Set<() => void>()
    private revisao = 0
    obterRevisao = () => this.revisao
    possui = (chave: string) => this.alvos.has(chave)
    observar = (ouvinte: () => void) => { this.ouvintes.add(ouvinte); return () => { this.ouvintes.delete(ouvinte) } }
    invalidar = () => { this.revisao++; this.ouvintes.forEach(ouvinte => ouvinte()) }
    registrar(chave: string, medir: MedirAlvoTour) {
        this.alvos.set(chave, medir)
        this.invalidar()
        return () => { if (this.alvos.get(chave) === medir) { this.alvos.delete(chave); this.invalidar() } }
    }
    medir(chave: string, resultado: (retangulo: RetanguloAlvoTour | null) => void) {
        const medir = this.alvos.get(chave)
        if (!medir) { resultado(null); return }
        try { medir(resultado) } catch { resultado(null) }
    }
}

/** Recusa alvos parcialmente fora da viewport, evitando um destaque enganoso. */
export function alvoVisivelTour(alvo: RetanguloAlvoTour | null, viewport: RetanguloAlvoTour): RetanguloAlvoTour | null {
    if (!alvo || ![alvo.x, alvo.y, alvo.largura, alvo.altura].every(Number.isFinite) || alvo.largura <= 0 || alvo.altura <= 0) return null
    if (alvo.x < viewport.x || alvo.y < viewport.y || alvo.x + alvo.largura > viewport.x + viewport.largura || alvo.y + alvo.altura > viewport.y + viewport.altura) return null
    return { ...alvo, x: alvo.x - viewport.x, y: alvo.y - viewport.y }
}
