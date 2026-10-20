export interface PermissaoLocalizacaoMarketplace { granted: boolean; status: string }
export interface PortaLocalizacaoMarketplace {
    lerPermissao: () => Promise<PermissaoLocalizacaoMarketplace>
    solicitarPermissao: () => Promise<PermissaoLocalizacaoMarketplace>
    explicar: () => Promise<boolean>
    obterPosicao: () => Promise<{ lat: number; lng: number }>
}
export type ResultadoLocalizacaoMarketplace = { tipo: 'NEGADA' } | { tipo: 'CANCELADA' } | { tipo: 'APLICADA'; posicao: { lat: number; lng: number } }

/** Não insiste em permissão negada e não muda filtros: apenas devolve uma escolha explícita. */
export async function obterLocalizacaoMarketplace(porta: PortaLocalizacaoMarketplace): Promise<ResultadoLocalizacaoMarketplace> {
    let permissao = await porta.lerPermissao()
    if (permissao.status === 'denied') return { tipo: 'NEGADA' }
    if (!permissao.granted) {
        if (!await porta.explicar()) return { tipo: 'CANCELADA' }
        permissao = await porta.solicitarPermissao()
    }
    if (!permissao.granted) return { tipo: 'NEGADA' }
    return { tipo: 'APLICADA', posicao: await porta.obterPosicao() }
}
