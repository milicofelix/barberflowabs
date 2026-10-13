import EstadoErro from '@/src/components/shared/EstadoErro'
import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import useAgendamento from '@/src/data/hooks/useAgendamento'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import FormularioAgendamento from './FormularioAgendamento'
import ImportadorContatos from '@/src/components/clientes/ImportadorContatos'

interface ClienteAgenda { id: number; nome: string; telefone?: string | null; email?: string | null }
interface UnidadeAgenda { id: number; nome: string; endereco?: string | null }
interface RecursoAgenda { id: number; nome: string; tipo: string; capacidade: number; unidadeId?: number | null }
interface ContextoAssistido {
    modeloAtendimento: 'PRESENCIAL' | 'DOMICILIAR' | 'HIBRIDO'
    unidades: UnidadeAgenda[]
    recursos: RecursoAgenda[]
}
type Origem = 'RECEPCAO' | 'TELEFONE' | 'WHATSAPP' | 'PRESENCIAL' | 'OUTRO'
type Modalidade = 'PRESENCIAL' | 'DOMICILIAR'

interface Props { dataInicial?: string; chaveInicial?: number }

export default function AgendamentoAssistido({ dataInicial, chaveInicial }: Props) {
    const { cores } = useTema()
    const { httpGet, httpPost } = useAPI()
    const {
        agendarPara, profissional, servicos, data, dataValida, unidadeId, selecionarUnidade, selecionarData,
        precoTotal, duracaoTotal,
    } = useAgendamento()
    const [clientes, setClientes] = useState<ClienteAgenda[]>([])
    const [contexto, setContexto] = useState<ContextoAssistido | null>(null)
    const [clienteId, setClienteId] = useState<number | null>(null)
    const [busca, setBusca] = useState('')
    const [novoCliente, setNovoCliente] = useState(false)
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [telefone, setTelefone] = useState('')
    const [modalidade, setModalidade] = useState<Modalidade>('PRESENCIAL')
    const [endereco, setEndereco] = useState('')
    const [deslocamento, setDeslocamento] = useState('0')
    const [origem, setOrigem] = useState<Origem>('RECEPCAO')
    const [observacoes, setObservacoes] = useState('')
    const [recursosAlocados, setRecursosAlocados] = useState<number[]>([])
    const [erro, setErro] = useState<string | null>(null)
    const [sucesso, setSucesso] = useState<string | null>(null)
    const [salvando, setSalvando] = useState(false)

    const carregarClientes = useCallback(async (termo = '') => {
        try {
            setErro(null)
            const query = termo.trim() ? `?busca=${encodeURIComponent(termo.trim())}` : ''
            setClientes(await httpGet<ClienteAgenda[]>(`/gestao/agendamentos/clientes${query}`))
        } catch (error) { setErro(mensagemDoErro(error)) }
    }, [httpGet])
    const carregarContexto = useCallback(async () => {
        try {
            const resposta = await httpGet<ContextoAssistido>('/gestao/agendamentos/contexto')
            setContexto(resposta)
            const modalidadeInicial = resposta.modeloAtendimento === 'DOMICILIAR' ? 'DOMICILIAR' : 'PRESENCIAL'
            setModalidade(modalidadeInicial)
            if (resposta.unidades.length === 1) selecionarUnidade(resposta.unidades[0].id)
        } catch (error) { setErro(mensagemDoErro(error)) }
    }, [httpGet, selecionarUnidade])

    useEffect(() => { carregarContexto() }, [carregarContexto])
    useEffect(() => {
        if (!dataInicial) return
        const selecionada = new Date(dataInicial)
        if (!Number.isNaN(selecionada.getTime()) && selecionada.getTime() > Date.now()) selecionarData(selecionada)
    }, [dataInicial, chaveInicial, selecionarData])
    useEffect(() => {
        const atraso = setTimeout(() => carregarClientes(busca), 300)
        return () => clearTimeout(atraso)
    }, [busca, carregarClientes])

    async function cadastrarCliente() {
        if (salvando) return
        if (!nome.trim() || (!email.trim() && !somenteDigitos(telefone))) { setErro('Informe o nome e ao menos um telefone ou e-mail.'); return }
        try {
            setSalvando(true); setErro(null)
            const criado = await httpPost<ClienteAgenda>('/gestao/clientes', {
                nome: nome.trim(), email: email.trim().toLowerCase() || undefined, telefone: somenteDigitos(telefone) || undefined,
            })
            setClienteId(criado.id); setNovoCliente(false); setNome(''); setEmail(''); setTelefone('')
            setBusca(criado.nome); await carregarClientes(criado.nome)
        } catch (error) { setErro(mensagemDoErro(error)) }
        finally { setSalvando(false) }
    }

    async function finalizar() {
        if (!clienteId || salvando) { setErro('Selecione ou cadastre o cliente que receberá o agendamento.'); return }
        if (!profissional || !servicos.length || !dataValida) { setErro('Complete profissional, serviços e horário.'); return }
        if (contexto?.unidades.length && !unidadeId && modalidade === 'PRESENCIAL') { setErro('Selecione a unidade do atendimento.'); return }
        if (modalidade === 'DOMICILIAR' && !endereco.trim()) { setErro('Informe o endereço do atendimento domiciliar.'); return }
        try {
            setSalvando(true); setErro(null); setSucesso(null); setRecursosAlocados([])
            const payload = {
                data: dataValida.toISOString(),
                profissionalId: profissional.id,
                servicoIds: servicos.map((servico) => servico.id),
                unidadeId: unidadeId ?? null,
                modeloAtendimento: modalidade,
                enderecoAtendimento: modalidade === 'DOMICILIAR' ? endereco.trim() : null,
                deslocamentoMinutos: modalidade === 'DOMICILIAR' ? Number(deslocamento || 0) : 0,
            }
            const disponibilidade = await httpPost<{ disponivel: boolean; motivo?: string; recursos?: Array<{ recursoId: number }> }>('/agenda/disponibilidade', payload)
            if (!disponibilidade.disponivel) throw new Error(disponibilidade.motivo ?? 'Horário indisponível.')
            setRecursosAlocados(disponibilidade.recursos?.map((item) => item.recursoId) ?? [])
            await agendarPara(clienteId, {
                unidadeId: payload.unidadeId,
                modeloAtendimento: modalidade,
                enderecoAtendimento: payload.enderecoAtendimento,
                deslocamentoMinutos: payload.deslocamentoMinutos,
                origem,
                observacoes,
            })
            setSucesso('Agendamento criado e disponibilidade confirmada.'); setClienteId(null); setObservacoes('')
        } catch (error) { setErro(mensagemDoErro(error)) }
        finally { setSalvando(false) }
    }

    const modalidades: Modalidade[] = contexto?.modeloAtendimento === 'HIBRIDO'
        ? ['PRESENCIAL', 'DOMICILIAR'] : [contexto?.modeloAtendimento === 'DOMICILIAR' ? 'DOMICILIAR' : 'PRESENCIAL']
    const preparacao = minutosPreparacao(servicos)
    const resumo = <View style={[styles.cartao, styles.resumoCartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <Text style={[styles.titulo, { color: cores.texto }]}>Resumo antes da confirmação</Text>
        <Text style={[styles.resumo, { color: cores.texto }]}>Cliente: {clientes.find((item) => item.id === clienteId)?.nome ?? 'não selecionado'}</Text>
        <Text style={[styles.resumo, { color: cores.texto }]}>Profissional: {profissional?.nome ?? 'não selecionado'}</Text>
        <Text style={[styles.resumo, { color: cores.texto }]}>Serviços: {servicos.map((item) => item.nome).join(', ') || 'não selecionados'}</Text>
        <Text style={[styles.resumoDestaque, { color: cores.destaque }]}>Duração: {duracaoTotal()} · Total: {precoTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        <Text style={[styles.resumo, { color: cores.textoSecundario }]}>Preparação operacional: {preparacao} min{modalidade === 'DOMICILIAR' ? ` · deslocamento: ${Number(deslocamento || 0)} min por trecho` : ''}</Text>
        {recursosAlocados.length ? <Text style={[styles.ajuda, { color: cores.sucesso }]}>Recursos validados: {recursosAlocados.map((id) => contexto?.recursos.find((item) => item.id === id)?.nome ?? `#${id}`).join(', ')}</Text> : null}
        <TextInput value={observacoes} onChangeText={setObservacoes} multiline placeholder="Observações internas do atendimento" placeholderTextColor={cores.textoSecundario} style={[styles.observacoes, { borderColor: cores.borda, color: cores.campoTexto, backgroundColor: cores.campo }]} />
    </View>

    return <View style={styles.container}>
        {dataInicial ? <View style={[styles.origemAgenda, { backgroundColor: cores.superficieElevada, borderColor: cores.destaque }]}>
            <Text style={[styles.origemAgendaTitulo, { color: cores.destaque }]}>Horário escolhido na agenda</Text>
            <Text style={[styles.origemAgendaData, { color: cores.texto }]}>{data.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</Text>
            <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>Complete os dados abaixo. O sistema confirmará todos os blocos necessários antes de agendar.</Text>
        </View> : null}
        <View style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.cabecalho}><View style={styles.cabecalhoTexto}><Text style={[styles.titulo, { color: cores.texto }]}>1. Cliente</Text>
                <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>Busque por nome, telefone ou e-mail, ou crie um cadastro para quem não usa o aplicativo.</Text></View>
                <Pressable onPress={() => setNovoCliente((atual) => !atual)} style={[styles.botaoSecundario, { borderColor: cores.destaque }]}><Text style={{ color: cores.destaque, fontWeight: '900' }}>{novoCliente ? 'Fechar' : '+ Novo'}</Text></Pressable></View>
            <ImportadorContatos compacto aoConcluir={() => carregarClientes(busca)} />
            {novoCliente ? <View style={styles.formNovo}><Campo value={nome} onChangeText={setNome} placeholder="Nome completo" /><Campo value={email} onChangeText={setEmail} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" />
                <Campo value={telefone} onChangeText={(valor) => setTelefone(mascaraTelefone(valor))} placeholder="Telefone" keyboardType="phone-pad" />
                <Pressable disabled={salvando} onPress={cadastrarCliente} style={[styles.botaoPrincipal, { backgroundColor: cores.destaque }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{salvando ? 'Salvando...' : 'Cadastrar e selecionar'}</Text></Pressable></View>
                : <><Campo value={busca} onChangeText={setBusca} placeholder="Buscar cliente por nome, telefone ou e-mail" /><ScrollView style={styles.opcoes} contentContainerStyle={styles.opcoesConteudo}
                    nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={clientes.length > 4}>{clientes.map((cliente) => <Pressable key={cliente.id} onPress={() => setClienteId(cliente.id)}
                    style={[styles.cliente, { borderColor: clienteId === cliente.id ? cores.destaque : cores.borda, backgroundColor: clienteId === cliente.id ? cores.superficieElevada : cores.superficie }]}>
                    <Text style={[styles.clienteNome, { color: cores.texto }]}>{cliente.nome}</Text><Text style={[styles.clienteContato, { color: cores.textoSecundario }]}>{cliente.telefone || cliente.email || 'Sem contato informado'}</Text>
                </Pressable>)}{!clientes.length ? <Text style={[styles.semResultados, { color: cores.textoSecundario }]}>Nenhum cliente encontrado.</Text> : null}</ScrollView></>}
        </View>

        <View style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <Text style={[styles.titulo, { color: cores.texto }]}>2. Local e origem</Text>
            {contexto?.unidades.length ? <><Text style={[styles.rotulo, { color: cores.texto }]}>Unidade</Text><View style={styles.chips}>{contexto.unidades.map((unidade) => <Chip key={unidade.id} texto={unidade.nome} ativo={unidadeId === unidade.id} onPress={() => selecionarUnidade(unidade.id)} />)}</View></> : null}
            <Text style={[styles.rotulo, { color: cores.texto }]}>Modalidade</Text><View style={styles.chips}>{modalidades.map((item) => <Chip key={item} texto={item === 'PRESENCIAL' ? 'Presencial' : 'Domiciliar'} ativo={modalidade === item} onPress={() => setModalidade(item)} />)}</View>
            {modalidade === 'DOMICILIAR' ? <><Campo value={endereco} onChangeText={setEndereco} placeholder="Endereço completo do atendimento" /><Campo value={deslocamento} onChangeText={(valor) => setDeslocamento(somenteDigitos(valor))} placeholder="Deslocamento em minutos" keyboardType="number-pad" /></> : null}
            <Text style={[styles.rotulo, { color: cores.texto }]}>Origem da solicitação</Text><View style={styles.chips}>{(['RECEPCAO', 'TELEFONE', 'WHATSAPP', 'PRESENCIAL', 'OUTRO'] as Origem[]).map((item) => <Chip key={item} texto={rotuloOrigem(item)} ativo={origem === item} onPress={() => setOrigem(item)} />)}</View>
        </View>

        {erro ? <EstadoErro mensagem={erro} tentarNovamente={() => { carregarClientes(busca); carregarContexto() }} /> : null}
        {sucesso ? <FeedbackSucesso mensagem={sucesso} /> : null}
        <FormularioAgendamento finalizar={finalizar} titulo="3. Atendimento" labelAcao={salvando ? 'Validando...' : 'Validar e agendar'} resumo={resumo} />
    </View>
}

function Campo(props: React.ComponentProps<typeof TextInput>) {
    const { cores } = useTema()
    return <TextInput {...props} placeholderTextColor={cores.textoSecundario} style={[styles.campo, { backgroundColor: cores.campo, borderColor: cores.borda, color: cores.campoTexto }, props.style]} />
}
function Chip({ texto, ativo, onPress }: { texto: string; ativo: boolean; onPress: () => void }) {
    const { cores } = useTema()
    return <Pressable onPress={onPress} style={[styles.chip, { borderColor: ativo ? cores.destaque : cores.borda, backgroundColor: ativo ? cores.destaque : 'transparent' }]}><Text style={{ color: ativo ? cores.destaqueTexto : cores.texto, fontSize: 11, fontWeight: '800' }}>{texto}</Text></Pressable>
}
function somenteDigitos(valor: string) { return valor.replace(/\D/g, '') }
function mascaraTelefone(valor: string) {
    const digitos = somenteDigitos(valor).slice(0, 11)
    if (digitos.length <= 2) return digitos
    if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
    if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}
function rotuloOrigem(origem: Origem) {
    return ({ RECEPCAO: 'Recepção', TELEFONE: 'Telefone', WHATSAPP: 'WhatsApp', PRESENCIAL: 'Presencial', OUTRO: 'Outro' } as Record<Origem, string>)[origem]
}
function minutosPreparacao(servicos: Array<{ preparoAntesMinutos?: number; preparoDepoisMinutos?: number }>) {
    if (!servicos.length) return 0
    const antes = Number(servicos[0].preparoAntesMinutos ?? 0)
    const depois = Number(servicos[servicos.length - 1].preparoDepoisMinutos ?? 0)
    const transicoes = servicos.slice(1).reduce((total, servico, indice) => total + Math.max(
        Number(servicos[indice].preparoDepoisMinutos ?? 0), Number(servico.preparoAntesMinutos ?? 0),
    ), 0)
    return antes + transicoes + depois
}

const styles = StyleSheet.create({
    container: { gap: 18 }, cartao: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 10 },
    origemAgenda: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 }, origemAgendaTitulo: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }, origemAgendaData: { fontSize: 16, fontWeight: '900' },
    cabecalho: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, cabecalhoTexto: { flex: 1 },
    titulo: { fontSize: 19, fontWeight: '900' }, ajuda: { lineHeight: 19, fontSize: 12 }, rotulo: { fontSize: 12, fontWeight: '900', marginTop: 3 },
    campo: { minHeight: 46, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12 }, formNovo: { gap: 9 },
    opcoes: { maxHeight: 260 }, opcoesConteudo: { gap: 8, paddingRight: 3 }, cliente: { borderWidth: 1, borderRadius: 10, padding: 12 }, clienteNome: { fontWeight: '800' }, clienteContato: { marginTop: 3, fontSize: 12 }, semResultados: { paddingVertical: 14, textAlign: 'center', fontSize: 12 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { minHeight: 36, paddingHorizontal: 11, borderWidth: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
    botaoSecundario: { minHeight: 38, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
    botaoPrincipal: { minHeight: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    resumoCartao: { marginTop: 16 }, resumo: { fontSize: 13, lineHeight: 19 }, resumoDestaque: { fontSize: 15, fontWeight: '900' },
    observacoes: { minHeight: 86, borderWidth: 1, borderRadius: 11, padding: 12, textAlignVertical: 'top' },
})
