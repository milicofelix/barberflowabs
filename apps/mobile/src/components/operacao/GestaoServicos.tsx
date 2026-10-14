import CampoTexto from '@/src/components/shared/CampoTexto'
import ServicosSugeridos from './ServicosSugeridos'
import SeletorImagem from '@/src/components/midia/SeletorImagem'
import Confirmacao from '@/src/components/shared/Confirmacao'
import EstadoErro from '@/src/components/shared/EstadoErro'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import { imagemDoServico } from '@/src/data/constants/imagens'
import useTema from '@/src/data/contexts/ContextoTema'
import type { DadosServicoOperacional, ModeloAtendimentoServico, ServicoOperacional } from '@/src/data/operacao/tipos'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface Props {
    itens: ServicoOperacional[]
    erro: string | null
    recarregar: () => void
    salvar: (dados: DadosServicoOperacional, id?: number) => Promise<boolean>
    excluir: (id: number) => Promise<boolean>
    profissionais: Array<{ id: number; nome: string }>
    carregando: boolean
}

interface Formulario {
    midiaId?: string | null
    nome: string
    descricao: string
    preco: string
    duracaoMinutos: string
    imagemURL: string
    observacoes: string
    modeloAtendimento: ModeloAtendimentoServico
    preparoAntesMinutos: string
    preparoDepoisMinutos: string
    deslocamentoMinutos: string
    profissionalIds: number[]
}

const INICIAL: Formulario = {
    nome: '', descricao: '', preco: '', duracaoMinutos: '30', imagemURL: '/servicos/corte-de-cabelo.jpg',
    observacoes: '', modeloAtendimento: 'PRESENCIAL', preparoAntesMinutos: '0', preparoDepoisMinutos: '0', deslocamentoMinutos: '0', profissionalIds: [],
}

const MODELOS: Array<{ id: ModeloAtendimentoServico; nome: string }> = [
    { id: 'PRESENCIAL', nome: 'No local' }, { id: 'DOMICILIAR', nome: 'Domiciliar' }, { id: 'HIBRIDO', nome: 'Híbrido' },
]

function formularioDoServico(servico: ServicoOperacional): Formulario {
    return {
        nome: servico.nome,
        descricao: servico.descricao,
        preco: String(servico.preco),
        duracaoMinutos: String(servico.duracaoMinutos ?? servico.qtdeSlots * 15),
        imagemURL: servico.imagemURL,
        observacoes: servico.observacoes ?? '',
        modeloAtendimento: servico.modeloAtendimento ?? 'PRESENCIAL',
        preparoAntesMinutos: String(servico.preparoAntesMinutos ?? 0),
        preparoDepoisMinutos: String(servico.preparoDepoisMinutos ?? 0),
        deslocamentoMinutos: String(servico.deslocamentoMinutos ?? 0),
        profissionalIds: servico.profissionalIds ?? [],
    }
}

export default function GestaoServicos({ itens, erro, recarregar, salvar, excluir, profissionais, carregando }: Props) {
    const { cores } = useTema()
    const [form, setForm] = useState<Formulario>(INICIAL)
    const [editandoId, setEditandoId] = useState<number | undefined>()
    const [excluirId, setExcluirId] = useState<number | null>(null)
    const [processando, setProcessando] = useState(false)
    const [validacao, setValidacao] = useState<string | null>(null)

    const alterar = (campo: keyof Formulario, valor: string) => setForm((atual) => ({ ...atual, [campo]: valor }))
    const novo = () => { setForm(INICIAL); setEditandoId(undefined); setValidacao(null) }
    const editar = (servico: ServicoOperacional) => { setForm(formularioDoServico(servico)); setEditandoId(servico.id); setValidacao(null) }
    const alternarProfissional = (id: number) => setForm((atual) => ({ ...atual,
        profissionalIds: atual.profissionalIds.includes(id) ? atual.profissionalIds.filter((item) => item !== id) : [...atual.profissionalIds, id],
    }))

    async function submeter() {
        const preco = Number(form.preco.replace(',', '.'))
        const duracao = Number(form.duracaoMinutos)
        if (!form.nome.trim() || !form.descricao.trim()) return setValidacao('Informe o nome e a descrição do serviço.')
        if (!Number.isFinite(preco) || preco <= 0) return setValidacao('Informe um preço válido.')
        if (!Number.isInteger(duracao) || duracao <= 0) return setValidacao('Informe a duração real em minutos.')
        if (!form.profissionalIds.length) return setValidacao('Habilite pelo menos um profissional para este serviço.')
        try {
            setProcessando(true); setValidacao(null)
            const concluido = await salvar({
                nome: form.nome.trim(), descricao: form.descricao.trim(), preco, imagemURL: form.imagemURL.trim(),
                duracaoMinutos: duracao, observacoes: form.observacoes, modeloAtendimento: form.modeloAtendimento,
                preparoAntesMinutos: Number(form.preparoAntesMinutos || 0), preparoDepoisMinutos: Number(form.preparoDepoisMinutos || 0),
                deslocamentoMinutos: form.modeloAtendimento === 'PRESENCIAL' ? 0 : Number(form.deslocamentoMinutos || 0),
                profissionalIds: form.profissionalIds,
                midiaId: form.midiaId,
            }, editandoId)
            if (concluido) novo()
        } finally { setProcessando(false) }
    }

    async function confirmarExclusao() {
        if (!excluirId) return
        try { setProcessando(true); if (await excluir(excluirId)) setExcluirId(null) }
        finally { setProcessando(false) }
    }

    return <View style={styles.lista}>
        <ServicosSugeridos servicos={itens} profissionais={profissionais} aoConcluir={recarregar} />
        <View style={[styles.formulario, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.cabecalho}><Text style={[styles.subtitulo, { color: cores.texto }]}>{editandoId ? 'Editar serviço' : 'Novo serviço'}</Text>
                {editandoId ? <Pressable onPress={novo}><Text style={{ color: cores.destaque, fontWeight: '800' }}>Cancelar edição</Text></Pressable> : null}</View>
            <CampoTexto label="Nome" value={form.nome} onChangeText={(v) => alterar('nome', v)} />
            <CampoTexto label="Descrição" value={form.descricao} onChangeText={(v) => alterar('descricao', v)} multiline />
            <View style={styles.duasColunas}><View style={styles.coluna}><CampoTexto label="Preço" value={form.preco} onChangeText={(v) => alterar('preco', v.replace(/[^0-9,.]/g, ''))} keyboardType="decimal-pad" /></View>
                <View style={styles.coluna}><CampoTexto label="Duração (min)" value={form.duracaoMinutos} onChangeText={(v) => alterar('duracaoMinutos', v.replace(/\D/g, ''))} keyboardType="number-pad" /></View></View>
            <Text style={[styles.rotulo, { color: cores.texto }]}>Modelo de atendimento</Text><View style={styles.modelos}>{MODELOS.map((modelo) => <Pressable key={modelo.id}
                onPress={() => alterar('modeloAtendimento', modelo.id)} style={[styles.chip, { borderColor: cores.borda }, form.modeloAtendimento === modelo.id && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}>
                <Text style={{ color: form.modeloAtendimento === modelo.id ? cores.destaqueTexto : cores.texto, fontWeight: '800' }}>{modelo.nome}</Text></Pressable>)}</View>
            <View style={styles.duasColunas}><View style={styles.coluna}><CampoTexto label="Preparo antes (min)" value={form.preparoAntesMinutos} onChangeText={(v) => alterar('preparoAntesMinutos', v.replace(/\D/g, ''))} keyboardType="number-pad" /></View>
                <View style={styles.coluna}><CampoTexto label="Preparo depois (min)" value={form.preparoDepoisMinutos} onChangeText={(v) => alterar('preparoDepoisMinutos', v.replace(/\D/g, ''))} keyboardType="number-pad" /></View></View>
            {form.modeloAtendimento !== 'PRESENCIAL' ? <CampoTexto label="Deslocamento (min)" value={form.deslocamentoMinutos} onChangeText={(v) => alterar('deslocamentoMinutos', v.replace(/\D/g, ''))} keyboardType="number-pad" /> : null}
            <Text style={[styles.rotulo, { color: cores.texto }]}>Profissionais habilitados</Text>
            {profissionais.length ? <View style={styles.profissionais}>{profissionais.map((profissional) => { const ativo = form.profissionalIds.includes(profissional.id); return <Pressable key={profissional.id}
                onPress={() => alternarProfissional(profissional.id)} style={[styles.chipProfissional, { borderColor: ativo ? cores.destaque : cores.borda, backgroundColor: ativo ? cores.destaque : cores.campo }]}>
                <Text style={{ color: ativo ? cores.destaqueTexto : cores.texto, fontWeight: '800' }}>{profissional.nome}</Text></Pressable> })}</View>
                : <Text style={[styles.aviso, { color: cores.textoSecundario }]}>Cadastre primeiro um profissional em Operação → Equipe.</Text>}
            <SeletorImagem valor={form.imagemURL} finalidade="SERVICO" padrao="/servicos/combo.jpg" disabled={processando} alterar={(imagemURL, midiaId) => setForm((atual) => ({ ...atual, imagemURL, midiaId }))} />
            <CampoTexto label="Requisitos e observações" value={form.observacoes} onChangeText={(v) => alterar('observacoes', v)} multiline />
            {validacao ? <Text style={styles.erro}>{validacao}</Text> : null}
            <Pressable disabled={processando} onPress={submeter} style={[styles.botao, processando && styles.desabilitado]}><Text style={styles.botaoTexto}>{processando ? 'Salvando...' : 'Salvar serviço'}</Text></Pressable>
        </View>
        {erro ? <EstadoErro mensagem={erro} tentarNovamente={recarregar} /> : null}
        {!carregando && !erro && itens.length === 0 ? <EstadoVazio titulo="Nenhum serviço cadastrado" /> : null}
        {itens.map((item) => <View key={item.id} style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.resumoCartao}><Image source={imagemDoServico(item.nome, item.imagemURL)} style={styles.imagem} />
            <View style={styles.info}><Text style={[styles.nome, { color: cores.texto }]}>{item.nome}</Text>
                <Text style={{ color: cores.textoSecundario }}>{Number(item.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · {item.duracaoMinutos ?? item.qtdeSlots * 15} min</Text>
                <Text style={[styles.modelo, { color: cores.destaque }]}>{(item.modeloAtendimento ?? 'PRESENCIAL').replace('_', ' ')}</Text></View></View>
            <View style={[styles.acoes, { borderTopColor: cores.borda }]}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Editar serviço ${item.nome}`} accessibilityState={{ disabled: processando }} disabled={processando}
                    onPress={() => editar(item)} style={({ pressed }) => [styles.botaoAcao, { backgroundColor: cores.campo, borderColor: cores.destaque }, (pressed || processando) && styles.desabilitado]}>
                    <Ionicons name="create-outline" size={20} color={cores.destaque} /><Text style={[styles.acao, { color: cores.destaque }]}>Editar</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Excluir serviço ${item.nome}`} accessibilityState={{ disabled: processando }} disabled={processando}
                    onPress={() => setExcluirId(item.id)} style={({ pressed }) => [styles.botaoAcao, styles.botaoExcluir, (pressed || processando) && styles.desabilitado]}>
                    <Ionicons name="trash-outline" size={20} color="#DC2626" /><Text style={[styles.acao, styles.excluir]}>Excluir</Text>
                </Pressable>
            </View>
        </View>)}
        <Confirmacao visivel={excluirId !== null} titulo="Excluir serviço" mensagem="O serviço será removido do catálogo. Registros vinculados podem impedir a exclusão."
            confirmarLabel={processando ? 'Excluindo...' : 'Excluir'} onConfirmar={confirmarExclusao} onCancelar={() => setExcluirId(null)} />
    </View>
}

const styles = StyleSheet.create({
    lista: { gap: 10 }, formulario: { borderWidth: 1, borderRadius: 14, padding: 15 }, cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    subtitulo: { fontSize: 18, fontWeight: '900' }, duasColunas: { flexDirection: 'row', gap: 10 }, coluna: { flex: 1 }, rotulo: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    modelos: { flexDirection: 'row', gap: 7, marginBottom: 16 }, chip: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingVertical: 9 }, profissionais: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 }, chipProfissional: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 }, aviso: { marginBottom: 16 },
    botao: { minHeight: 48, borderRadius: 11, backgroundColor: '#E7B84B', alignItems: 'center', justifyContent: 'center' }, botaoTexto: { color: '#081426', fontWeight: '900' }, desabilitado: { opacity: 0.6 }, erro: { color: '#DC2626', marginBottom: 10 },
    cartao: { gap: 12, borderWidth: 1, borderRadius: 13, padding: 13 }, resumoCartao: { flexDirection: 'row', alignItems: 'center', gap: 11 }, imagem: { width: 58, height: 58, borderRadius: 10 }, info: { flex: 1, gap: 3 }, nome: { fontSize: 16, fontWeight: '800' }, modelo: { fontSize: 11, fontWeight: '800' },
    acoes: { flexDirection: 'row', gap: 10, borderTopWidth: 1, paddingTop: 12 }, botaoAcao: { flex: 1, minHeight: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 12 }, botaoExcluir: { borderColor: '#DC2626', backgroundColor: 'rgba(220, 38, 38, 0.08)' }, acao: { fontWeight: '800', fontSize: 14 }, excluir: { color: '#DC2626' },
})
