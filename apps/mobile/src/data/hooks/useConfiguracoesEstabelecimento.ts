import useAPI, { mensagemDoErro } from './useAPI'
import { useCallback, useEffect, useState } from 'react'

export interface PerfilConfiguracao {
    nomePublico?: string | null; descricaoPublica?: string | null; telefone?: string | null; email?: string | null
    endereco?: string | null; bairro?: string | null; cidade?: string | null; estado?: string | null
    aceitaAgendamentoOnline: boolean; reviewStatus?: string
}
export interface HorarioFuncionamento {
    id?: number; diaSemana: number; inicio: string; fim: string
    intervaloInicio?: string | null; intervaloFim?: string | null; ativo?: boolean
}
interface AgendaConfiguracao { antecedenciaMinutos: number; horarios: HorarioFuncionamento[] }

export default function useConfiguracoesEstabelecimento() {
    const { httpGet, httpPut } = useAPI()
    const [perfil, setPerfil] = useState<PerfilConfiguracao | null>(null)
    const [agenda, setAgenda] = useState<AgendaConfiguracao | null>(null)
    const [catalogo, setCatalogo] = useState<any>(null)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)

    const carregar = useCallback(async () => {
        try {
            setCarregando(true); setErro(null)
            const [dadosPerfil, dadosAgenda, dadosCatalogo] = await Promise.all([
                httpGet<PerfilConfiguracao>('/estabelecimentos/minha/perfil-publico'),
                httpGet<AgendaConfiguracao>('/agenda/configuracao/horarios'),
                httpGet('/catalogo/estabelecimento'),
            ])
            setPerfil(dadosPerfil); setAgenda(dadosAgenda); setCatalogo(dadosCatalogo)
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setCarregando(false) }
    }, [httpGet])
    useEffect(() => { carregar() }, [carregar])

    async function salvar() {
        if (!perfil || !agenda || salvando) return
        try {
            setSalvando(true); setErro(null); setSucesso(null)
            const [perfilAtualizado, agendaAtualizada] = await Promise.all([
                httpPut<PerfilConfiguracao>('/estabelecimentos/minha/perfil-publico', perfil),
                httpPut<AgendaConfiguracao>('/agenda/configuracao/horarios', agenda),
            ])
            setPerfil(perfilAtualizado); setAgenda(agendaAtualizada); setSucesso('Configurações atualizadas.')
        } catch (e) { setErro(mensagemDoErro(e)) } finally { setSalvando(false) }
    }

    return { perfil, setPerfil, agenda, setAgenda, catalogo, carregando, salvando, erro, sucesso, carregar, salvar }
}
