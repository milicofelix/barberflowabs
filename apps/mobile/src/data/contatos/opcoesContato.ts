/** Remove repetições dentro do mesmo contato, nunca funde pessoas diferentes. */
export function opcoesUnicas<T>(itens: T[], identidade: (item: T) => string): T[] {
    const vistos = new Set<string>()
    return itens.filter((item) => {
        const chave = identidade(item)
        if (!chave || vistos.has(chave)) return false
        vistos.add(chave)
        return true
    })
}
export function chaveTelefone(valor: string): string {
    return normalizarTelefoneBrasil(valor).replace(/\D/g, '') || somenteDigitosTelefone(valor)
}

/** Normaliza telefone brasileiro e completa números locais de 8/9 dígitos com o DDD informado. */
export function normalizarTelefoneBrasil(valor?: string, dddPadrao?: string): string {
    let digitos = somenteDigitosTelefone(valor)
    const ddd = normalizarDdd(dddPadrao)
    if (!digitos) return ''
    if (digitos.startsWith('00')) digitos = digitos.slice(2)
    if (digitos.length === 8 || digitos.length === 9) {
        if (!ddd) return ''
        digitos = `55${ddd}${digitos}`
    } else if (digitos.length === 10 || digitos.length === 11) {
        digitos = `55${digitos}`
    }
    return digitos.length >= 12 && digitos.length <= 15 ? `+${digitos}` : ''
}

/** Obtém o DDD brasileiro mais recorrente sem inventar localização quando não há referência. */
export function inferirDddPadrao(telefones: string[]): string {
    const frequencias = new Map<string, number>()
    telefones.forEach((valor) => {
        let digitos = somenteDigitosTelefone(valor)
        if (digitos.startsWith('00')) digitos = digitos.slice(2)
        if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) digitos = digitos.slice(2)
        if (digitos.length !== 10 && digitos.length !== 11) return
        const ddd = normalizarDdd(digitos.slice(0, 2))
        if (ddd) frequencias.set(ddd, (frequencias.get(ddd) ?? 0) + 1)
    })
    return [...frequencias.entries()].sort(([dddA, totalA], [dddB, totalB]) => totalB - totalA || dddA.localeCompare(dddB))[0]?.[0] ?? ''
}

export function telefoneEhLocal(valor?: string): boolean {
    const tamanho = somenteDigitosTelefone(valor).length
    return tamanho === 8 || tamanho === 9
}

function somenteDigitosTelefone(valor?: string) {
    return String(valor ?? '').replace(/\D/g, '')
}

function normalizarDdd(valor?: string) {
    const ddd = somenteDigitosTelefone(valor).slice(0, 2)
    return ddd.length === 2 && ddd !== '00' ? ddd : ''
}
