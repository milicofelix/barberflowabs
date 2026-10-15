import { rotuloStatus, comecaEmDezMinutos } from '@uniflowabs/core'
import CartaoAtendimento, { corStatusAtendimento } from './CartaoAtendimento'
import useTema from '@/src/data/contexts/ContextoTema'
import type {
    AgendamentoOperacional, FiltrosAgendaOperacional, ProfissionalOperacional,
    RestricaoAgendaOperacional, VisualizacaoAgenda,
} from '@/src/data/operacao/tipos'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useSincronizacaoAtendimentos from '@/src/data/hooks/useSincronizacaoAtendimentos'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native'
import { Calendar, type ICalendarEventBase } from 'react-native-big-calendar'
import 'dayjs/locale/pt-br'

type CategoriaEvento = 'ATENDIMENTO' | 'PREPARACAO' | 'DESLOCAMENTO' | 'RESTRICAO'
interface EventoAgenda extends ICalendarEventBase {
    categoria: CategoriaEvento
    agendamento?: AgendamentoOperacional
    restricao?: RestricaoAgendaOperacional
}

const visualizacoes: Array<{ id: VisualizacaoAgenda; nome: string }> = [
    { id: 'day', nome: 'Dia' }, { id: '3days', nome: '3 dias' },
    { id: 'week', nome: 'Semana' }, { id: 'schedule', nome: 'Lista' },
]
const statusAgenda = ['AGENDADO', 'CONFIRMADO', 'ATRASADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW']

interface Props {
    telaCheia?: boolean
    itens: AgendamentoOperacional[]
    restricoes: RestricaoAgendaOperacional[]
    profissionais: ProfissionalOperacional[]
    filtros: FiltrosAgendaOperacional
    alterarFiltros: (filtros: FiltrosAgendaOperacional) => void
    data: string
    visualizacao: VisualizacaoAgenda
    alterarVisualizacao: (visualizacao: VisualizacaoAgenda) => void
    alterarData: (data: string) => void
    aoPressionarCelula: (data: Date) => void
    reagendar: (item: AgendamentoOperacional, data: string, motivo?: string) => Promise<boolean>
    fusoHorario: string
}

export default function AgendaCalendario(props: Props) {
    const { cores } = useTema()
    const { height: alturaTela } = useWindowDimensions()
    const [alturaHora, setAlturaHora] = useState(64)
    const [filtrosVisiveis, setFiltrosVisiveis] = useState(false)
    const [selecionado, setSelecionado] = useState<AgendamentoOperacional | null>(null)
    const { httpGet } = useAPI()
    useEffect(() => { setSelecionado(null) }, [httpGet])
    const [erroDetalhe, setErroDetalhe] = useState('')
    const consultaDetalhe = useRef(0)
    const selecionadoId = selecionado?.id
    const atualizarDetalhe = useCallback(async () => {
        if (!selecionadoId) return false
        const ticket = ++consultaDetalhe.current
        try {
            const item = await httpGet<AgendamentoOperacional>(`/gestao/agendamentos/${selecionadoId}`)
            if (ticket !== consultaDetalhe.current) return false
            setSelecionado((atual) => atual?.id === item.id ? item : atual); setErroDetalhe('')
            return true
        } catch (e) { if (ticket === consultaDetalhe.current) setErroDetalhe(mensagemDoErro(e)); return false }
    }, [selecionadoId, httpGet])
    useEffect(() => { setErroDetalhe(''); return () => { consultaDetalhe.current++ } }, [atualizarDetalhe])
    const agora = useSincronizacaoAtendimentos(atualizarDetalhe, !!selecionadoId)
    useEffect(() => { setSelecionado((atual) => atual ? props.itens.find((item) => item.id === atual.id) ?? atual : null) }, [props.itens])
    const [reagendando, setReagendando] = useState(false)
    const [novaData, setNovaData] = useState('')
    const [novoHorario, setNovoHorario] = useState('')
    const [motivo, setMotivo] = useState('')
    const [salvando, setSalvando] = useState(false)
    const eventos = useMemo(() => criarEventos(props.itens, props.restricoes), [props.itens, props.restricoes])
    const alturaCalendario = props.telaCheia
        ? Math.max(320, alturaTela - (filtrosVisiveis ? 440 : 300))
        : Math.max(220, Math.min(600, alturaTela - (filtrosVisiveis ? 610 : 485)))

    const tema = useMemo(() => ({
        palette: {
            primary: { main: cores.destaque, contrastText: cores.destaqueTexto }, nowIndicator: cores.perigo,
            gray: { 100: cores.superficie, 200: cores.superficieElevada, 300: cores.borda, 500: cores.textoSecundario, 800: cores.texto },
        },
    }), [cores])

    const abrirReagendamento = () => {
        if (!selecionado) return
        const atual = new Date(selecionado.data)
        setNovaData(formatarData(atual))
        setNovoHorario(atual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        setMotivo('')
        setReagendando(true)
    }
    const confirmarReagendamento = async () => {
        if (!selecionado || salvando) return
        if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(novoHorario)) {
            Alert.alert('Data ou horário inválido', 'Use os formatos AAAA-MM-DD e HH:mm.')
            return
        }
        const destino = new Date(`${novaData}T${novoHorario}:00`)
        if (destino.getTime() <= Date.now()) {
            Alert.alert('Horário inválido', 'Escolha uma data e um horário futuros.')
            return
        }
        setSalvando(true)
        const sucesso = await props.reagendar(selecionado, destino.toISOString(), motivo)
        setSalvando(false)
        if (sucesso) { setReagendando(false); setSelecionado(null) }
    }
    const pressionarCelula = (data: Date) => {
        // A biblioteca devolve o início da célula horária. Verificamos toda a
        // célula para que pequenas áreas visuais ao redor de um evento não
        // iniciem, por engano, outro agendamento no mesmo período.
        const inicioCelula = data.getTime()
        const fimCelula = inicioCelula + 60 * 60 * 1000
        const eventoSobreposto = eventos.find((evento) => evento.start.getTime() < fimCelula && evento.end.getTime() > inicioCelula)
        if (eventoSobreposto?.agendamento) {
            setSelecionado(eventoSobreposto.agendamento)
            return
        }
        if (eventoSobreposto?.restricao) {
            Alert.alert('Período indisponível', eventoSobreposto.restricao.motivo)
            return
        }
        props.aoPressionarCelula(new Date(data))
    }

    return <View style={styles.raiz}>
        <View style={styles.barra}>
            <View style={styles.visualizacoes} accessibilityRole="tablist">
                {visualizacoes.map((item) => <Chip key={item.id} texto={item.nome} ativo={props.visualizacao === item.id} onPress={() => props.alterarVisualizacao(item.id)} />)}
            </View>
            <Text style={[styles.fuso, { color: cores.textoSecundario }]}>Horários em {props.fusoHorario}</Text>
            {props.visualizacao !== 'schedule' ? <View style={styles.zoom}>
                <Pressable accessibilityRole="button" accessibilityLabel="Diminuir escala da agenda" onPress={() => setAlturaHora((atual) => Math.max(44, atual - 10))} style={[styles.zoomBotao, { borderColor: cores.borda }]}><Text style={{ color: cores.texto }}>−</Text></Pressable>
                <Text style={[styles.zoomTexto, { color: cores.textoSecundario }]}>Zoom</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Aumentar escala da agenda" onPress={() => setAlturaHora((atual) => Math.min(100, atual + 10))} style={[styles.zoomBotao, { borderColor: cores.borda }]}><Text style={{ color: cores.texto }}>＋</Text></Pressable>
            </View> : null}
            <Pressable onPress={() => setFiltrosVisiveis((atual) => !atual)} style={[styles.abrirFiltros, { borderColor: cores.borda }]}>
                <Text style={{ color: cores.texto, fontSize: 11, fontWeight: '900' }}>{filtrosVisiveis ? 'Ocultar filtros' : 'Filtrar profissionais e status'}</Text>
                <Text style={{ color: cores.destaque }}>{filtrosVisiveis ? '⌃' : '⌄'}</Text>
            </Pressable>
            {filtrosVisiveis ? <FiltrosAgenda {...props} /> : null}
        </View>

        <View style={[styles.calendario, { borderColor: cores.borda, backgroundColor: cores.superficie }]}>
            <Calendar<EventoAgenda> events={eventos} height={alturaCalendario}
                date={new Date(`${props.data}T12:00:00`)} mode={props.visualizacao} locale="pt-br" weekStartsOn={1} ampm={false}
                hourRowHeight={alturaHora} minHour={6} maxHour={23} scrollOffsetMinutes={7 * 60} swipeEnabled showTime eventsAreSorted
                theme={tema} eventCellStyle={(evento) => estiloEvento(evento, cores, agora)} eventCellAccessibilityProps={{ accessibilityRole: 'button' }}
                onPressCell={pressionarCelula}
                onPressEvent={(evento) => evento.agendamento ? setSelecionado(evento.agendamento) : evento.restricao && Alert.alert('Período indisponível', evento.restricao.motivo)}
                onSwipeEnd={(data) => props.alterarData(formatarData(data))} moreLabel="{moreCount} mais"
                calendarContainerStyle={{ backgroundColor: cores.superficie }} bodyContainerStyle={{ backgroundColor: cores.superficie }} />
        </View>
        <View style={styles.legenda}>
            <Legenda cor={cores.destaque} texto="Agendado" /><Legenda cor={cores.sucesso} texto="Confirmado" />
            <Legenda cor="#1E40AF" texto="Em atendimento" /><Legenda cor="#92400E" texto="Em atraso" /><Legenda cor="#065F46" texto="Finalizado" />
            <Legenda cor="#F97316" texto="Deslocamento" /><Legenda cor={cores.perigo} texto="Bloqueado/ausente" />
        </View>
        <Modal visible={Boolean(selecionado)} transparent animationType="fade" onRequestClose={() => setSelecionado(null)}>
            <View style={styles.modalFundo}>
                <View style={{ maxHeight: '90%', backgroundColor: cores.superficie, borderRadius: 14, padding: 12, gap: 12 }}>
                <ScrollView keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 10 }}>
                    {erroDetalhe ? <Text accessibilityRole="alert" style={{ color: cores.perigo }}>{erroDetalhe}</Text> : null}
                    {selecionado ? <CartaoAtendimento item={selecionado} agora={agora} aoAtualizar={setSelecionado} /> : null}
                    {selecionado && ['AGENDADO', 'CONFIRMADO'].includes(selecionado.status) ? <Pressable accessibilityRole="button" onPress={abrirReagendamento} style={[styles.reagendar, { backgroundColor: cores.destaque }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>Reagendar</Text></Pressable> : null}
                </ScrollView>
                <Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes sem alterar atendimento" onPress={() => setSelecionado(null)} style={[styles.reagendar, { backgroundColor: cores.destaque }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '800' }}>Fechar</Text></Pressable>
                </View>
            </View>
        </Modal>
        <Modal visible={reagendando} transparent animationType="slide" onRequestClose={() => setReagendando(false)}>
            <View style={styles.modalFundo}><View style={[styles.detalhes, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                <Text style={[styles.detalhesTitulo, { color: cores.texto }]}>Reagendar atendimento</Text>
                <Text style={[styles.detalhesMeta, { color: cores.textoSecundario }]}>A disponibilidade de profissional, recursos e deslocamento será validada antes da alteração.</Text>
                <View style={styles.campos}><TextInput value={novaData} onChangeText={setNovaData} placeholder="AAAA-MM-DD" placeholderTextColor={cores.textoSecundario} style={[styles.campo, { color: cores.texto, borderColor: cores.borda }]} />
                    <TextInput value={novoHorario} onChangeText={setNovoHorario} placeholder="HH:mm" placeholderTextColor={cores.textoSecundario} style={[styles.campo, styles.campoHorario, { color: cores.texto, borderColor: cores.borda }]} /></View>
                <TextInput value={motivo} onChangeText={setMotivo} placeholder="Motivo do reagendamento (opcional)" placeholderTextColor={cores.textoSecundario} style={[styles.campo, { color: cores.texto, borderColor: cores.borda }]} />
                <View style={styles.acoesRodape}><Pressable disabled={salvando} onPress={() => setReagendando(false)} style={[styles.botaoRodape, { borderColor: cores.borda }]}><Text style={{ color: cores.texto, fontWeight: '800' }}>Voltar</Text></Pressable>
                    <Pressable disabled={salvando} onPress={confirmarReagendamento} style={[styles.botaoRodape, { backgroundColor: cores.destaque, borderColor: cores.destaque }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{salvando ? 'Validando...' : 'Validar e reagendar'}</Text></Pressable></View>
            </View></View>
        </Modal>
        <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>Toque em um espaço livre para iniciar um agendamento. Deslize lateralmente para mudar o período.</Text>
    </View>
}

function FiltrosAgenda(props: Props) {
    const { cores } = useTema()
    const definir = (parcial: Partial<FiltrosAgendaOperacional>) => props.alterarFiltros({ ...props.filtros, ...parcial })
    return <View style={styles.filtros}>
        <Text style={[styles.filtroTitulo, { color: cores.texto }]}>Coluna/foco profissional</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroLinha}>
            <Chip texto="Todos" ativo={!props.filtros.profissionalId} onPress={() => definir({ profissionalId: null })} />
            {props.profissionais.map((item) => <Chip key={item.id} texto={item.nome} ativo={props.filtros.profissionalId === item.id} onPress={() => definir({ profissionalId: item.id })} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroLinha}>
            <Chip texto="Todos os status" ativo={!props.filtros.status} onPress={() => definir({ status: null })} />
            {statusAgenda.map((status) => <Chip key={status} texto={rotuloStatus(status)} ativo={props.filtros.status === status} onPress={() => definir({ status })} />)}
        </ScrollView>
    </View>
}

function Chip({ texto, ativo, onPress }: { texto: string; ativo: boolean; onPress: () => void }) {
    const { cores } = useTema()
    return <Pressable accessibilityRole="button" accessibilityState={{ selected: ativo }} onPress={onPress} style={[styles.chip, { borderColor: ativo ? cores.destaque : cores.borda, backgroundColor: ativo ? cores.destaque : 'transparent' }]}>
        <Text numberOfLines={1} style={[styles.chipTexto, { color: ativo ? cores.destaqueTexto : cores.texto }]}>{texto}</Text></Pressable>
}

function criarEventos(itens: AgendamentoOperacional[], restricoes: RestricaoAgendaOperacional[]): EventoAgenda[] {
    const eventos: EventoAgenda[] = []
    itens.forEach((item) => {
        const titulo = `${rotuloStatus(item.status)} · ${item.usuario?.nome ?? 'Cliente'} · ${item.servicos?.map((servico) => servico.nome).join(', ') || 'Atendimento'}`
        eventos.push({ title: titulo, start: new Date(item.periodos?.atendimento.inicio ?? item.data), end: new Date(item.periodos?.atendimento.fim ?? item.dataFim ?? item.data), categoria: 'ATENDIMENTO', agendamento: item })
        const preparacoes = [item.periodos?.preparacaoAntes, item.periodos?.preparacaoDepois].filter(Boolean)
        preparacoes.forEach((periodo) => periodo && eventos.push({ title: `Preparação · ${item.profissional?.nome ?? ''}`, start: new Date(periodo.inicio), end: new Date(periodo.fim), categoria: 'PREPARACAO', agendamento: item }))
        const deslocamentos = [item.periodos?.deslocamentoAntes, item.periodos?.deslocamentoDepois].filter(Boolean)
        deslocamentos.forEach((periodo) => periodo && eventos.push({ title: `Deslocamento · ${item.profissional?.nome ?? ''}`, start: new Date(periodo.inicio), end: new Date(periodo.fim), categoria: 'DESLOCAMENTO', agendamento: item }))
    })
    restricoes.forEach((item) => eventos.push({ title: `Indisponível · ${item.motivo}`, start: new Date(item.inicio), end: new Date(item.fim), categoria: 'RESTRICAO', restricao: item }))
    return eventos
}

function estiloEvento(evento: EventoAgenda, cores: ReturnType<typeof useTema>['cores'], agora: number) {
    if (evento.categoria === 'RESTRICAO') return { backgroundColor: cores.perigo, borderColor: cores.perigo, borderRadius: 4, opacity: 0.72 }
    if (evento.categoria === 'PREPARACAO') return { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9', borderRadius: 4 }
    if (evento.categoria === 'DESLOCAMENTO') return { backgroundColor: '#F97316', borderColor: '#F97316', borderRadius: 4 }
    const status = evento.agendamento?.status
    const cor = corStatusAtendimento(status ?? '')
    const iminente = evento.agendamento && comecaEmDezMinutos(evento.agendamento, agora)
    return { backgroundColor: cor, borderColor: iminente ? '#FDBA74' : cor, borderWidth: iminente ? 3 : 1, borderRadius: 7 }
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
    return <View style={styles.legendaItem}><View style={[styles.legendaCor, { backgroundColor: cor }]} /><Text style={styles.legendaTexto}>{texto}</Text></View>
}
function formatarData(data: Date) { return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}` }
const styles = StyleSheet.create({
    raiz: { gap: 9 }, barra: { gap: 7 }, visualizacoes: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' }, fuso: { fontSize: 11, fontWeight: '700' },
    chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, minHeight: 36, alignItems: 'center', justifyContent: 'center' }, chipTexto: { fontSize: 11, fontWeight: '800' },
    zoom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }, zoomBotao: { width: 38, height: 32, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, zoomTexto: { fontSize: 12, fontWeight: '700' },
    abrirFiltros: { minHeight: 38, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    filtros: { gap: 5 }, filtroTitulo: { fontSize: 11, fontWeight: '900' }, filtroLinha: { gap: 7, paddingRight: 18 },
    calendario: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' }, legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, legendaCor: { width: 9, height: 9, borderRadius: 5 }, legendaTexto: { color: '#64748B', fontSize: 10, fontWeight: '700' }, ajuda: { fontSize: 11, lineHeight: 15 },
    modalFundo: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(0,0,0,0.62)' }, detalhes: { borderWidth: 1, borderRadius: 13, padding: 15, gap: 12 }, detalhesCabecalho: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, detalhesTexto: { flex: 1 }, detalhesTitulo: { fontSize: 17, fontWeight: '900' }, detalhesMeta: { marginTop: 4, lineHeight: 18 }, alerta: { marginTop: 7, fontSize: 12, fontWeight: '800' }, fechar: { width: 34, height: 34, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, statusAtual: { fontSize: 12, fontWeight: '900' },
    acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, acao: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 }, acaoTexto: { fontSize: 10, fontWeight: '800' }, reagendar: { minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    campos: { flexDirection: 'row', gap: 8 }, campo: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12 }, campoHorario: { maxWidth: 100 }, acoesRodape: { flexDirection: 'row', gap: 8 }, botaoRodape: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
})
