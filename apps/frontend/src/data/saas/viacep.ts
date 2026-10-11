import { somenteDigitos } from '@/components/saas/solicitacao-estabelecimento.types'

export interface EnderecoViaCep {
    cep: string
    logradouro: string
    complemento: string
    bairro: string
    localidade: string
    uf: string
    erro?: boolean
}

export async function consultarViaCep(cepInformado: string): Promise<EnderecoViaCep> {
    const cep = somenteDigitos(cepInformado)
    if (cep.length !== 8) throw new Error('Informe um CEP com oito dígitos.')
    const controlador = new AbortController()
    const timeout = window.setTimeout(() => controlador.abort(), 7000)
    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controlador.signal })
        if (!resposta.ok) throw new Error('Não foi possível consultar o CEP agora.')
        const endereco = await resposta.json() as EnderecoViaCep
        if (endereco.erro) throw new Error('CEP não encontrado. Confira os números ou preencha o endereço manualmente.')
        return endereco
    } catch (erro) {
        if (erro instanceof Error && erro.name === 'AbortError') throw new Error('A consulta demorou demais. Preencha o endereço manualmente.')
        throw erro
    } finally {
        window.clearTimeout(timeout)
    }
}
