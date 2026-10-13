import useTema from '@/src/data/contexts/ContextoTema'
import type {
    AgendamentoOperacional, FiltrosAgendaOperacional, ProfissionalOperacional,
    RecursoOperacional, RestricaoAgendaOperacional, VisualizacaoAgenda,
} from '@/src/data/operacao/tipos'
import { useMemo, useState } from 'react'
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
const statusAgenda = ['AGENDADO', 'CONFIRMADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW']
const transicoes: Record<string, string[]> = {
    AGENDADO: ['CONFIRMADO', 'CANCELADO', 'NO_SHOW'],
    CONFIRMADO: ['CHECKIN', 'CANCELADO', 'NO_SHOW'],
    CHECKIN: ['CONCLUIDO', 'CANCELADO', 'NO_SHOW'],
    CONCLUIDO: [], CANCELADO: [], NO_SHOW: [],
}

interface Props {
    itens: AgendamentoOperacional[]
    restricoes: RestricaoAgendaOperacional[]
    profissionais: ProfissionalOperacional[]
    recursos: RecursoOperacional[]
    filtros: FiltrosAgendaOperacional
    alterarFiltros: (filtros: FiltrosAgendaOperacional) => void
    data: string
    visualizacao: VisualizacaoAgenda
    alterarVisualizacao: (visualizacao: VisualizacaoAgenda) => void
    alterarData: (data: string) => void
    alterarStatus: (id: number, status: string) => Promise<boolean>
    reagendar: (item: AgendamentoOperacional, data: string, motivo?: string) => Promise<boolean>
    fusoHorario: string
}

export default function AgendaCalendario(props: Props) {
    const { cores } = useTema()
    const { height: alturaTela } = useWindowDimensions()
    const [alturaHora, setAlturaHora] = useState(64)
    const [filtrosVisiveis, setFiltrosVisiveis] = useState(false)
    const [selecionado, setSelecionado] = useState<AgendamentoOperacional | null>(null)
    const [reagendando, setReagendando] = useState(false)
    const [novaData, setNovaData] = useState('')
    const [novoHorario, setNovoHorario] = useState('')
    const [motivo, setMotivo] = useState('')
    const [salvando, setSalvando] = useState(false)
    const eventos = useMemo(() => criarEventos(props.itens, props.restricoes), [props.itens, props.restricoes])

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
    const solicitarStatus = (status: string) => {
        if (!selecionado || salvando) return
        Alert.alert('Confirmar alteração', `Alterar o agendamento para ${rotuloStatus(status)}?`, [
            { text: 'Voltar', style: 'cancel' },
            { text: 'Confirmar', style: status === 'CANCELADO' || status === 'NO_SHOW' ? 'destructive' : 'default', onPress: async () => {
                setSalvando(true)
                const sucesso = await props.alterarStatus(selecionado.id, status)
                setSalvando(false)
                if (sucesso) setSelecionado((atual) => atual ? { ...atual, status } : atual)
            } },
        ])
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
                <Text style={{ color: cores.texto, fontSize: 11, fontWeight: '900' }}>{filtrosVisiveis ? 'Ocultar filtros' : 'Filtrar colunas, recursos e status'}</Text>
                <Text style={{ color: cores.destaque }}>{filtrosVisiveis ? '⌃' : '⌄'}</Text>
            </Pressable>
            {filtrosVisiveis ? <FiltrosAgenda {...props} /> : null}
        </View>

        <View style={[styles.calendario, { borderColor: cores.borda, backgroundColor: cores.superficie }]}>
            <Calendar<EventoAgenda> events={eventos} height={Math.max(220, Math.min(600, alturaTela - (filtrosVisiveis ? 610 : 485)))}
                date={new Date(`${props.data}T12:00:00`)} mode={props.visualizacao} locale="pt-br" weekStartsOn={1} ampm={false}
                hourRowHeight={alturaHora} minHour={6} maxHour={23} scrollOffsetMinutes={7 * 60} swipeEnabled showTime eventsAreSorted
                theme={tema} eventCellStyle={(evento) => estiloEvento(evento, cores)} eventCellAccessibilityProps={{ accessibilityRole: 'button' }}
                onPressEvent={(evento) => evento.agendamento ? setSelecionado(evento.agendamento) : evento.restricao && Alert.alert('Período indisponível', evento.restricao.motivo)}
                onSwipeEnd={(data) => props.alterarData(formatarData(data))} moreLabel="{moreCount} mais"
                calendarContainerStyle={{ backgroundColor: cores.superficie }} bodyContainerStyle={{ backgroundColor: cores.superficie }} />
        </View>
        <View style={styles.legenda}>
            <Legenda cor={cores.destaque} texto="Agendado" /><Legenda cor={cores.sucesso} texto="Confirmado" />
            <Legenda cor="#7C3AED" texto="Em atendimento" /><Legenda cor="#0EA5E9" texto="Preparação" />
            <Legenda cor="#F97316" texto="Deslocamento" /><Legenda cor={cores.perigo} texto="Bloqueado/ausente" />
        </View>
        <Modal visible={Boolean(selecionado)} transparent animationType="fade" onRequestClose={() => setSelecionado(null)}>
            <Pressable style={styles.modalFundo} onPress={() => setSelecionado(null)}>
                {selecionado ? <Pressable onPress={() => undefined} style={[styles.detalhes, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                    <View style={styles.detalhesCabecalho}><View style={styles.detalhesTexto}>
                        <Text style={[styles.detalhesTitulo, { color: cores.texto }]}>{selecionado.usuario?.nome ?? 'Cliente'}</Text>
                        <Text style={[styles.detalhesMeta, { color: cores.textoSecundario }]}>{selecionado.profissional?.nome ?? 'Profissional'} · {dataHora(selecionado.data)}</Text>
                        <Text style={[styles.detalhesMeta, { color: cores.textoSecundario }]}>{selecionado.servicos?.map((servico) => servico.nome).join(' · ')}</Text>
                        {selecionado.unidade?.nome ? <Text style={[styles.detalhesMeta, { color: cores.textoSecundario }]}>Unidade: {selecionado.unidade.nome}</Text> : null}
                        {selecionado.origem ? <Text style={[styles.detalhesMeta, { color: cores.textoSecundario }]}>Origem: {selecionado.origem.replace('_', ' ')}{selecionado.criadoPor?.nome ? ` · registrado por ${selecionado.criadoPor.nome}` : ''}</Text> : null}
                        {selecionado.observacoes ? <Text style={[styles.detalhesMeta, { color: cores.texto }]}>Observação: {selecionado.observacoes}</Text> : null}
                        {selecionado.modeloAtendimento === 'DOMICILIAR' ? <Text style={[styles.alerta, { color: '#F97316' }]}>⌂ Atendimento domiciliar · deslocamento {selecionado.deslocamentoMinutos ?? 0} min</Text> : null}
                    </View><Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes" onPress={() => setSelecionado(null)} style={[styles.fechar, { borderColor: cores.borda }]}><Text style={{ color: cores.texto }}>×</Text></Pressable></View>
                    <Text style={[styles.statusAtual, { color: cores.destaque }]}>Status: {rotuloStatus(selecionado.status)}</Text>
                    <View style={styles.acoes}>{acoesDisponiveis(selecionado).map((status) => <Pressable key={status} disabled={salvando} onPress={() => solicitarStatus(status)}
                        style={[styles.acao, { borderColor: status === 'CANCELADO' || status === 'NO_SHOW' ? cores.perigo : cores.borda }]}>
                        <Text style={[styles.acaoTexto, { color: status === 'CANCELADO' || status === 'NO_SHOW' ? cores.perigo : cores.texto }]}>{rotuloStatus(status)}</Text></Pressable>)}</View>
                    {['AGENDADO', 'CONFIRMADO'].includes(selecionado.status) ? <Pressable onPress={abrirReagendamento} style={[styles.reagendar, { backgroundColor: cores.destaque }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>Reagendar</Text></Pressable> : null}
                </Pressable> : null}
            </Pressable>
        </Modal>
        <Modal visible={reagendando} transparent animationType="slide" onRequestClose={() => setReagendando(false)}>
            <View style={styles.modalFundo}><View style={[styles.detalhes, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                <Text style={[styles.detalhesTitulo, { color: cores.texto }]}>Reagendar atendimento</Text>
                <Text style={[styles.detalhesMeta, { color: cores.textoSecundario }]}>A disponibilidade completa de profissional, recursos, preparação e deslocamento será validada antes da alteração.</Text>
                <View style={styles.campos}><TextInput value={novaData} onChangeText={setNovaData} placeholder="AAAA-MM-DD" placeholderTextColor={cores.textoSecundario} style={[styles.campo, { color: cores.texto, borderColor: cores.borda }]} />
                    <TextInput value={novoHorario} onChangeText={setNovoHorario} placeholder="HH:mm" placeholderTextColor={cores.textoSecundario} style={[styles.campo, styles.campoHorario, { color: cores.texto, borderColor: cores.borda }]} /></View>
                <TextInput value={motivo} onChangeText={setMotivo} placeholder="Motivo do reagendamento (opcional)" placeholderTextColor={cores.textoSecundario} style={[styles.campo, { color: cores.texto, borderColor: cores.borda }]} />
                <View style={styles.acoesRodape}><Pressable disabled={salvando} onPress={() => setReagendando(false)} style={[styles.botaoRodape, { borderColor: cores.borda }]}><Text style={{ color: cores.texto, fontWeight: '800' }}>Voltar</Text></Pressable>
                    <Pressable disabled={salvando} onPress={confirmarReagendamento} style={[styles.botaoRodape, { backgroundColor: cores.destaque, borderColor: cores.destaque }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{salvando ? 'Validando...' : 'Validar e reagendar'}</Text></Pressable></View>
            </View></View>
        </Modal>
        <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>Deslize lateralmente para mudar o período. Movimentos por arraste ficam bloqueados até poderem ser validados com segurança.</Text>
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
        {props.recursos.length ? <><Text style={[styles.filtroTitulo, { color: cores.texto }]}>Recurso</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtroLinha}>
            <Chip texto="Todos" ativo={!props.filtros.recursoId} onPress={() => definir({ recursoId: null })} />
            {props.recursos.map((item) => <Chip key={item.id} texto={item.nome} ativo={props.filtros.recursoId === item.id} onPress={() => definir({ recursoId: item.id })} />)}
        </ScrollView></> : null}
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
        const titulo = `${item.usuario?.nome ?? 'Cliente'} · ${item.servicos?.map((servico) => servico.nome).join(', ') || 'Atendimento'}`
        eventos.push({ title: titulo, start: new Date(item.periodos?.atendimento.inicio ?? item.data), end: new Date(item.periodos?.atendimento.fim ?? item.data), categoria: 'ATENDIMENTO', agendamento: item })
        const preparacoes = [item.periodos?.preparacaoAntes, item.periodos?.preparacaoDepois].filter(Boolean)
        preparacoes.forEach((periodo) => periodo && eventos.push({ title: `Preparação · ${item.profissional?.nome ?? ''}`, start: new Date(periodo.inicio), end: new Date(periodo.fim), categoria: 'PREPARACAO', agendamento: item }))
        const deslocamentos = [item.periodos?.deslocamentoAntes, item.periodos?.deslocamentoDepois].filter(Boolean)
        deslocamentos.forEach((periodo) => periodo && eventos.push({ title: `Deslocamento · ${item.profissional?.nome ?? ''}`, start: new Date(periodo.inicio), end: new Date(periodo.fim), categoria: 'DESLOCAMENTO', agendamento: item }))
    })
    restricoes.forEach((item) => eventos.push({ title: `Indisponível · ${item.motivo}`, start: new Date(item.inicio), end: new Date(item.fim), categoria: 'RESTRICAO', restricao: item }))
    return eventos
}

function estiloEvento(evento: EventoAgenda, cores: ReturnType<typeof useTema>['cores']) {
    if (evento.categoria === 'RESTRICAO') return { backgroundColor: cores.perigo, borderColor: cores.perigo, borderRadius: 4, opacity: 0.72 }
    if (evento.categoria === 'PREPARACAO') return { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9', borderRadius: 4 }
    if (evento.categoria === 'DESLOCAMENTO') return { backgroundColor: '#F97316', borderColor: '#F97316', borderRadius: 4 }
    const status = evento.agendamento?.status
    const cor = status === 'CONFIRMADO' ? cores.sucesso : status === 'CHECKIN' ? '#7C3AED' : status === 'CONCLUIDO' ? cores.textoSecundario : ['CANCELADO', 'NO_SHOW'].includes(status ?? '') ? cores.perigo : cores.destaque
    return { backgroundColor: cor, borderColor: cor, borderRadius: 7 }
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
    return <View style={styles.legendaItem}><View style={[styles.legendaCor, { backgroundColor: cor }]} /><Text style={styles.legendaTexto}>{texto}</Text></View>
}
function formatarData(data: Date) { return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}` }
function dataHora(valor: string) { return new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) }
function rotuloStatus(status: string) { return ({ AGENDADO: 'Agendado', CONFIRMADO: 'Confirmado', CHECKIN: 'Check-in', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado', NO_SHOW: 'Ausência' } as Record<string, string>)[status] ?? status }
function acoesDisponiveis(item: AgendamentoOperacional) {
    return (transicoes[item.status] ?? []).filter((status) => status !== 'NO_SHOW' || new Date(item.data).getTime() <= Date.now())
}

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
