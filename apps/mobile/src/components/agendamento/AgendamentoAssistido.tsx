import EstadoErro from '@/src/components/shared/EstadoErro'
import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import useAgendamento from '@/src/data/hooks/useAgendamento'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import FormularioAgendamento from './FormularioAgendamento'

interface ClienteAgenda { id: number; nome: string; telefone?: string | null; email?: string | null }

export default function AgendamentoAssistido() {
    const { cores } = useTema()
    const { httpGet } = useAPI()
    const { agendarPara } = useAgendamento()
    const [clientes, setClientes] = useState<ClienteAgenda[]>([])
    const [clienteId, setClienteId] = useState<number | null>(null)
    const [busca, setBusca] = useState('')
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)
    const [salvando, setSalvando] = useState(false)

    const carregar = useCallback(async () => {
        try { setErro(null); setClientes(await httpGet<ClienteAgenda[]>('/gestao/agendamentos/clientes')) }
        catch (error) { setErro(mensagemDoErro(error)) }
    }, [httpGet])
    useEffect(() => { carregar() }, [carregar])
    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase()
        return termo ? clientes.filter((item) => `${item.nome} ${item.telefone ?? ''} ${item.email ?? ''}`.toLowerCase().includes(termo)) : clientes
    }, [busca, clientes])

    async function finalizar() {
        if (!clienteId || salvando) { setErro('Selecione o cliente que receberá o agendamento.'); return }
        try {
            setSalvando(true); setErro(null); setSucesso(null)
            await agendarPara(clienteId)
            setSucesso('Agendamento criado para o cliente.'); setClienteId(null)
        } catch (error) { setErro(mensagemDoErro(error)) }
        finally { setSalvando(false) }
    }

    return <View style={styles.container}>
        <View style={[styles.clientes, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <Text style={[styles.titulo, { color: cores.texto }]}>Cliente do agendamento</Text>
            <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>Escolha um cliente cadastrado pelo estabelecimento, inclusive quem não utiliza o aplicativo.</Text>
            <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar por nome, telefone ou e-mail" placeholderTextColor={cores.textoSecundario}
                style={[styles.busca, { backgroundColor: cores.campo, borderColor: cores.borda, color: cores.campoTexto }]} />
            <View style={styles.opcoes}>{filtrados.map((cliente) => <Pressable key={cliente.id} onPress={() => setClienteId(cliente.id)}
                style={[styles.cliente, { borderColor: clienteId === cliente.id ? cores.destaque : cores.borda, backgroundColor: clienteId === cliente.id ? cores.superficieElevada : cores.superficie }]}>
                <Text style={[styles.clienteNome, { color: cores.texto }]}>{cliente.nome}</Text>
                <Text style={[styles.clienteContato, { color: cores.textoSecundario }]}>{cliente.telefone || cliente.email || 'Sem contato informado'}</Text>
            </Pressable>)}</View>
        </View>
        {erro ? <EstadoErro mensagem={erro} tentarNovamente={carregar} /> : null}
        {sucesso ? <FeedbackSucesso mensagem={sucesso} /> : null}
        <FormularioAgendamento finalizar={finalizar} titulo="Novo horário para cliente" labelAcao={salvando ? 'Agendando...' : 'Agendar cliente'} />
    </View>
}

const styles = StyleSheet.create({
    container: { gap: 18 }, clientes: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 10 },
    titulo: { fontSize: 19, fontWeight: '900' }, ajuda: { lineHeight: 19 },
    busca: { minHeight: 46, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12 },
    opcoes: { gap: 8 }, cliente: { borderWidth: 1, borderRadius: 10, padding: 12 },
    clienteNome: { fontWeight: '800' }, clienteContato: { marginTop: 3, fontSize: 12 },
})
