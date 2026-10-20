import type { EstabelecimentoResumo } from '../estabelecimentos/tipos'

export function possuiCoordenadasMapa(item: Pick<EstabelecimentoResumo, 'endereco'>) {
    const { latitude, longitude } = item.endereco
    return latitude != null && longitude != null && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
        && Number(latitude) >= -90 && Number(latitude) <= 90 && Number(longitude) >= -180 && Number(longitude) <= 180
}

export function retanguloMarcadorMapa(ponto: { x: number; y: number }, largura: number, altura: number) {
    const retangulo = { x: ponto.x - 27, y: ponto.y - 54 * 0.95, largura: 54, altura: 54 }
    if (![ponto.x, ponto.y, largura, altura].every(Number.isFinite) || largura <= 0 || altura <= 0 || retangulo.x < 0 || retangulo.y < 0
        || retangulo.x + 54 > largura || retangulo.y + 54 > altura) return null
    return retangulo
}
