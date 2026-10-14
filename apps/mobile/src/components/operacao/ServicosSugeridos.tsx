import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import CampoTexto from '@/src/components/shared/CampoTexto'
import useTema from '@/src/data/contexts/ContextoTema'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import SeletorImagem from '@/src/components/midia/SeletorImagem'
import type { ModeloAtendimentoServico, ServicoOperacional } from '@/src/data/operacao/tipos'

interface Sugestao {
    imagemURL: string
    id: number; segmentoId: number; nome: string; descricao: string
    segmento: { id: number; nome: string }
    especialidades: Array<{ id: number; nome: string }>
    modeloAtendimento: ModeloAtendimentoServico
    duracaoMinutos: number; preparoAntesMinutos: number; preparoDepoisMinutos: number; deslocamentoMinutos: number
}
interface Catalogo {
    modeloAtendimento: ModeloAtendimentoServico
    segmentos: Array<{ segmentoId: number; segmento: { id: number; nome: string } }>
}
interface Revisao {
    imagemURL: string; midiaId?: string | null
    servicoSugeridoId: number; preco: string; duracaoMinutos: string
    modeloAtendimento: ModeloAtendimentoServico
    preparoAntesMinutos: string; preparoDepoisMinutos: string; deslocamentoMinutos: string
    profissionalIds: number[]
}
interface Resultado {
    criados: Array<{ id: number; nome: string; servicoSugeridoId?: number | null }>
    ignorados: Array<{ servicoSugeridoId: number; nome?: string; motivo: string }>
}

export default function ServicosSugeridos({ servicos, profissionais, aoConcluir }: {
    servicos: ServicoOperacional[]
    profissionais: Array<{ id: number; nome: string }>
    aoConcluir: () => void | Promise<void>
}) {
    const { cores } = useTema()
    const { httpGet, httpPost, httpPut } = useAPI()
    const [aberto, setAberto] = useState(false)
    const [carregando, setCarregando] = useState(false)
    const [salvando, setSalvando] = useState(false)
    const bloqueado = useRef(false)
    const [erro, setErro] = useState('')
    const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
    const [catalogo, setCatalogo] = useState<Catalogo | null>(null)
    const [busca, setBusca] = useState('')
    const [segmentoId, setSegmentoId] = useState<number | null>(null)
    const [selecionados, setSelecionados] = useState<Record<number, Revisao>>({})
    const [revisando, setRevisando] = useState(false)
    const [resultado, setResultado] = useState<Resultado | null>(null)
    const [tentativa, setTentativa] = useState(0)

    useEffect(() => {
        if (!aberto) return
        let vigente = true
        setCarregando(true); setErro('')
        Promise.all([httpGet<Sugestao[]>('/catalogo/servicos-sugeridos'), httpGet<Catalogo>('/catalogo/estabelecimento')])
            .then(([itens, configuracao]) => { if (vigente) { setSugestoes(itens); setCatalogo(configuracao) } })
            .catch((e) => { if (vigente) setErro(mensagemDoErro(e)) })
            .finally(() => { if (vigente) setCarregando(false) })
        return () => { vigente = false }
    }, [aberto, httpGet, tentativa])

    function abrir() {
        setBusca(''); setSegmentoId(null); setSelecionados({}); setRevisando(false); setResultado(null); setAberto(true)
    }
    function fechar() { if (!bloqueado.current) setAberto(false) }
    function selecionar(item: Sugestao) {
        setSelecionados((atuais) => {
            const copia = { ...atuais }
            if (copia[item.id]) delete copia[item.id]
            else copia[item.id] = {
                servicoSugeridoId: item.id, preco: '', duracaoMinutos: String(item.duracaoMinutos),
                imagemURL: item.imagemURL,
                modeloAtendimento: catalogo?.modeloAtendimento === 'HIBRIDO' ? item.modeloAtendimento : (catalogo?.modeloAtendimento ?? item.modeloAtendimento),
                preparoAntesMinutos: String(item.preparoAntesMinutos), preparoDepoisMinutos: String(item.preparoDepoisMinutos),
                deslocamentoMinutos: String(item.deslocamentoMinutos), profissionalIds: [],
            }
            return copia
        })
    }
    function alterar(id: number, campo: keyof Revisao, valor: string | number[]) {
        setSelecionados((atuais) => ({ ...atuais, [id]: { ...atuais[id], [campo]: valor } }))
    }
    async function importar() {
        if (bloqueado.current) return
        const itens = Object.values(selecionados).map((item) => ({
            ...item, preco: Number(item.preco.replace(',', '.')), duracaoMinutos: Number(item.duracaoMinutos),
            preparoAntesMinutos: Number(item.preparoAntesMinutos), preparoDepoisMinutos: Number(item.preparoDepoisMinutos),
            deslocamentoMinutos: item.modeloAtendimento === 'PRESENCIAL' ? 0 : Number(item.deslocamentoMinutos),
        }))
        if (!itens.length) return
        const invalido = itens.find((item) => !Number.isFinite(item.preco) || item.preco <= 0
            || !Number.isInteger(item.duracaoMinutos) || item.duracaoMinutos <= 0
            || [item.preparoAntesMinutos, item.preparoDepoisMinutos, item.deslocamentoMinutos].some((valor) => !Number.isInteger(valor) || valor < 0))
        if (invalido) { setErro(`Revise preço, duração e preparação de ${sugestoes.find((s) => s.id === invalido.servicoSugeridoId)?.nome ?? 'todos os serviços'}.`); return }
        bloqueado.current = true; setSalvando(true); setErro('')
        try {
            const resposta = await httpPost<Resultado>('/servicos/sugeridos/importar', { itens })
            const falhas: string[] = []
            for (const item of itens.filter((i) => i.midiaId !== undefined)) {
                const criado = resposta.criados.find((s) => s.servicoSugeridoId === item.servicoSugeridoId) ?? servicos.find((s) => s.servicoSugeridoId === item.servicoSugeridoId)
                if (criado) try { await httpPut('/midias/associacao', { entidade: 'SERVICO', entidadeId: criado.id, midiaId: item.midiaId }) }
                catch { falhas.push(criado.nome) }
            }
            setResultado(resposta); setSelecionados({})
            try { await aoConcluir() } catch { setErro('Serviços adicionados. Atualize a lista para consultar as alterações.') }
            if (falhas.length) setErro(`Serviços adicionados. Revise as imagens na edição: ${falhas.join(', ')}.`)
        } catch (e) { setErro(mensagemDoErro(e)) }
        finally { bloqueado.current = false; setSalvando(false) }
    }

    const idsPermitidos = new Set(catalogo?.segmentos.map((item) => item.segmentoId) ?? [])
    const jaImportados = new Set(servicos.map((item) => item.servicoSugeridoId))
    const nomesAtuais = new Set(servicos.map((item) => item.nome.trim().toLocaleLowerCase('pt-BR')))
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    const visiveis = sugestoes.filter((item) => idsPermitidos.has(item.segmentoId) && !jaImportados.has(item.id)
        && !nomesAtuais.has(item.nome.trim().toLocaleLowerCase('pt-BR')) && (segmentoId === null || item.segmentoId === segmentoId)
        && (!termo || `${item.nome} ${item.descricao} ${item.especialidades.map((e) => e.nome).join(' ')}`.toLocaleLowerCase('pt-BR').includes(termo)))
    const total = Object.keys(selecionados).length
    const modelos: ModeloAtendimentoServico[] = catalogo?.modeloAtendimento === 'HIBRIDO' ? ['PRESENCIAL', 'DOMICILIAR', 'HIBRIDO'] : [catalogo?.modeloAtendimento ?? 'PRESENCIAL']
    const botao = (texto: string, acao: () => void, desabilitado = false) => <Pressable accessibilityRole="button" accessibilityState={{ disabled: desabilitado }} disabled={desabilitado} onPress={acao}
        style={[styles.botao, { backgroundColor: cores.destaque }, desabilitado && { opacity: 0.5 }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '800' }}>{texto}</Text></Pressable>
    const chip = (texto: string, ativo: boolean, acao: () => void) => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: ativo }} onPress={acao}
        style={[styles.chip, { borderColor: cores.borda, backgroundColor: ativo ? cores.destaque : cores.campo }]}><Text style={{ color: ativo ? cores.destaqueTexto : cores.texto }}>{texto}</Text></Pressable>

    return <>
        {botao('✦ Serviços sugeridos', abrir)}
        <Modal visible={aberto} animationType="slide" presentationStyle="fullScreen" onRequestClose={fechar}>
            <SafeAreaView style={[styles.safe, { backgroundColor: cores.fundo }]}>
                <View style={styles.cabecalho}><Text style={[styles.titulo, { color: cores.texto }]}>Serviços sugeridos</Text>
                    <Pressable disabled={salvando} accessibilityRole="button" accessibilityLabel="Fechar serviços sugeridos" onPress={fechar} style={styles.fechar}><Text style={{ color: cores.destaque }}>Fechar</Text></Pressable></View>
                <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.conteudo}>
                        {carregando ? <ActivityIndicator accessibilityLabel="Carregando sugestões" color={cores.destaque} /> : null}
                        {erro ? <Text accessibilityRole="alert" style={styles.erro}>{erro}</Text> : null}
                        {erro && !catalogo && !carregando ? botao('Tentar novamente', () => setTentativa((atual) => atual + 1)) : null}
                        {resultado ? <>
                            <Text style={[styles.titulo, { color: cores.texto }]}>{resultado.criados.length} serviço(s) adicionado(s)</Text>
                            {resultado.criados.map((item) => <Text key={item.id} style={{ color: cores.texto }}>✓ {item.nome}</Text>)}
                            {resultado.ignorados.map((item) => <Text key={item.servicoSugeridoId} style={{ color: cores.textoSecundario }}>{item.nome ?? `Serviço ${item.servicoSugeridoId}`}: {item.motivo}</Text>)}
                            {botao('Concluir', fechar)}
                        </> : !carregando && catalogo ? <>
                            {!revisando ? <>
                                <CampoTexto label="Buscar serviço ou especialidade" value={busca} onChangeText={setBusca} />
                                <View style={styles.chips}>{chip('Todos os meus segmentos', segmentoId === null, () => setSegmentoId(null))}
                                    {catalogo.segmentos.map((item) => <View key={item.segmentoId}>{chip(item.segmento.nome, segmentoId === item.segmentoId, () => setSegmentoId(item.segmentoId))}</View>)}</View>
                                {visiveis.map((item) => <Pressable key={item.id} accessibilityRole="checkbox" accessibilityState={{ checked: !!selecionados[item.id] }} onPress={() => selecionar(item)}
                                    style={[styles.cartao, { borderColor: selecionados[item.id] ? cores.destaque : cores.borda, backgroundColor: cores.superficie }]}>
                                    <Text style={[styles.nome, { color: cores.texto }]}>{selecionados[item.id] ? '☑' : '□'} {item.nome}</Text>
                                    <Text style={{ color: cores.textoSecundario }}>{item.descricao}</Text>
                                    <Text style={{ color: cores.destaque }}>{item.segmento.nome} · {item.duracaoMinutos} min</Text>
                                </Pressable>)}
                                {!visiveis.length ? <Text style={{ color: cores.textoSecundario }}>{!idsPermitidos.size ? 'Configure os segmentos do estabelecimento para consultar sugestões.' : 'Nenhuma sugestão disponível para este filtro. Serviços já cadastrados são omitidos.'}</Text> : null}
                            </> : sugestoes.filter((item) => selecionados[item.id]).map((item) => {
                                const form = selecionados[item.id]!
                                return <View key={item.id} style={[styles.cartao, { borderColor: cores.borda, backgroundColor: cores.superficie }]}>
                                    <Text style={[styles.nome, { color: cores.texto }]}>{item.nome}</Text>
                                    <SeletorImagem valor={form.imagemURL} finalidade="SERVICO" padrao="/servicos/combo.jpg" disabled={salvando} alterar={(imagemURL, midiaId) => setSelecionados((atuais) => ({ ...atuais, [item.id]: { ...atuais[item.id]!, imagemURL, midiaId } }))} />
                                    <CampoTexto label="Preço (R$)" value={form.preco} keyboardType="decimal-pad" onChangeText={(v) => alterar(item.id, 'preco', v.replace(/[^0-9,.]/g, ''))} />
                                    {(['duracaoMinutos', 'preparoAntesMinutos', 'preparoDepoisMinutos'] as const).map((campo, indice) => <CampoTexto key={campo} label={['Duração (min)', 'Preparação antes (min)', 'Preparação depois (min)'][indice]!} value={form[campo]} keyboardType="number-pad" onChangeText={(v) => alterar(item.id, campo, v.replace(/\D/g, ''))} />)}
                                    <Text style={{ color: cores.texto }}>Modalidade</Text><View style={styles.chips}>{modelos.map((modelo) => <View key={modelo}>{chip(modelo === 'PRESENCIAL' ? 'No local' : modelo === 'DOMICILIAR' ? 'Domiciliar' : 'Híbrido', form.modeloAtendimento === modelo, () => alterar(item.id, 'modeloAtendimento', modelo))}</View>)}</View>
                                    {form.modeloAtendimento !== 'PRESENCIAL' ? <CampoTexto label="Deslocamento (min)" value={form.deslocamentoMinutos} keyboardType="number-pad" onChangeText={(v) => alterar(item.id, 'deslocamentoMinutos', v.replace(/\D/g, ''))} /> : null}
                                    <Text style={{ color: cores.texto }}>Profissionais habilitados</Text><View style={styles.chips}>{profissionais.map((p) => <View key={p.id}>{chip(p.nome, form.profissionalIds.includes(p.id), () => alterar(item.id, 'profissionalIds', form.profissionalIds.includes(p.id) ? form.profissionalIds.filter((id) => id !== p.id) : [...form.profissionalIds, p.id]))}</View>)}</View>
                                    {!profissionais.length ? <Text style={{ color: cores.textoSecundario }}>Cadastre os profissionais em Equipe para habilitar o atendimento.</Text> : null}
                                </View>
                            })}
                        </> : null}
                    </ScrollView>
                    {!carregando && catalogo && !resultado ? <View style={[styles.rodape, { borderColor: cores.borda }]}>
                        <Text style={{ color: cores.texto }}>{total} selecionado(s)</Text>
                        {revisando ? <Pressable disabled={salvando} accessibilityRole="button" onPress={() => setRevisando(false)} style={styles.fechar}><Text style={{ color: cores.destaque }}>Voltar à seleção</Text></Pressable> : null}
                        {botao(salvando ? 'Adicionando...' : revisando ? 'Adicionar serviços' : 'Revisar selecionados', revisando ? importar : () => { setErro(''); setRevisando(true) }, salvando || total === 0)}
                    </View> : null}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    </>
}

const styles = StyleSheet.create({
    safe: { flex: 1 }, cabecalho: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    titulo: { fontSize: 20, fontWeight: '900', flexShrink: 1 }, fechar: { padding: 12, minHeight: 44 },
    conteudo: { padding: 16, gap: 12 }, cartao: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 },
    nome: { fontSize: 17, fontWeight: '800' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 12, minHeight: 44, borderWidth: 1, borderRadius: 20 },
    botao: { padding: 16, minHeight: 48, borderRadius: 12, alignItems: 'center' },
    rodape: { padding: 16, gap: 6, borderTopWidth: 1 }, erro: { color: '#DC2626' },
})
