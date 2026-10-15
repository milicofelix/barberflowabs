export const CHAVES_FOTOS_PROFISSIONAIS_LEGADAS = Array.from({ length: 6 }, (_, indice) => `profissional-${indice + 1}`)

/** Caminhos das fotos demonstrativas aposentadas; não identifica pessoas pelo nome. */
export function imagemProfissionalLegada(url?: string | null): boolean {
    const caminho = url?.trim().replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0]
    return !!caminho && /^\/profissionais\/profissional-[1-6]\.jpg$/i.test(caminho)
}

export function imagemPadraoProfissional(sexo?: string | null): string {
    return sexo === 'FEMININO' ? '/profissionais/avatar-feminino.png' : '/profissionais/avatar-masculino.png'
}

export function urlImagemProfissional(url?: string | null, sexo?: string | null): string {
    const imagem = url?.trim()
    const caminho = imagem?.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/)[0]
    if (!imagem || imagemProfissionalLegada(imagem) || /^\/profissionais\/avatar-(masculino|feminino)\.png$/i.test(caminho ?? '')) {
        // Sem sexo informado, preserva uma silhueta explícita; nunca volta à foto demonstrativa.
        if (sexo !== 'FEMININO' && sexo !== 'MASCULINO' && caminho?.endsWith('avatar-feminino.png')) return '/profissionais/avatar-feminino.png'
        return imagemPadraoProfissional(sexo)
    }
    return imagem
}
