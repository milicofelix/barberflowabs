import useTema from '@/src/data/contexts/ContextoTema'
import type { AgendamentoOperacional, VisualizacaoAgenda } from '@/src/data/operacao/tipos'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Calendar, type ICalendarEventBase } from 'react-native-big-calendar'
import 'dayjs/locale/pt-br'

interface EventoAgenda extends ICalendarEventBase {
    agendamento: AgendamentoOperacional
}

const visualizacoes: Array<{ id: VisualizacaoAgenda; nome: string }> = [
    { id: 'day', nome: 'Dia' },
    { id: '3days', nome: '3 dias' },
    { id: 'week', nome: 'Semana' },
    { id: 'schedule', nome: 'Lista' },
]

export default function AgendaCalendario({
    itens,
    data,
    visualizacao,
    alterarVisualizacao,
    alterarData,
    alterarStatus,
    fusoHorario,
}: {
    itens: AgendamentoOperacional[]
    data: string
    visualizacao: VisualizacaoAgenda
    alterarVisualizacao: (visualizacao: VisualizacaoAgenda) => void
    alterarData: (data: string) => void
    alterarStatus: (id: number, status: string) => Promise<boolean>
    fusoHorario: string
}) {
    const { cores } = useTema()
    const [alturaHora, setAlturaHora] = useState(64)
    const [selecionado, setSelecionado] = useState<AgendamentoOperacional | null>(null)
    const eventos = useMemo<EventoAgenda[]>(() => itens.map((item) => ({
        title: `${item.usuario?.nome ?? 'Cliente'} · ${item.servicos?.map((servico) => servico.nome).join(', ') || 'Atendimento'}`,
        start: new Date(item.periodos?.ocupacao.inicio ?? item.data),
        end: new Date(item.periodos?.ocupacao.fim ?? item.data),
        agendamento: item,
    })), [itens])

    const tema = useMemo(() => ({
        palette: {
            primary: { main: cores.destaque, contrastText: cores.destaqueTexto },
            nowIndicator: cores.perigo,
            gray: {
                100: cores.superficie,
                200: cores.superficieElevada,
                300: cores.borda,
                500: cores.textoSecundario,
                800: cores.texto,
            },
        },
    }), [cores])

    return <View style={styles.raiz}>
        <View style={styles.barra}>
            <View style={styles.visualizacoes} accessibilityRole="tablist">
                {visualizacoes.map((item) => <Pressable key={item.id} accessibilityRole="tab"
                    accessibilityState={{ selected: visualizacao === item.id }} onPress={() => alterarVisualizacao(item.id)}
                    style={[styles.chip, { borderColor: cores.borda }, visualizacao === item.id && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}>
                    <Text style={[styles.chipTexto, { color: visualizacao === item.id ? cores.destaqueTexto : cores.texto }]}>{item.nome}</Text>
                </Pressable>)}
            </View>
            <Text style={[styles.fuso, { color: cores.textoSecundario }]}>Horários em {fusoHorario}</Text>
            {visualizacao !== 'schedule' ? <View style={styles.zoom}>
                <Pressable accessibilityRole="button" accessibilityLabel="Diminuir escala da agenda" onPress={() => setAlturaHora((atual) => Math.max(44, atual - 10))} style={[styles.zoomBotao, { borderColor: cores.borda }]}><Text style={{ color: cores.texto }}>−</Text></Pressable>
                <Text style={[styles.zoomTexto, { color: cores.textoSecundario }]}>Zoom</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Aumentar escala da agenda" onPress={() => setAlturaHora((atual) => Math.min(100, atual + 10))} style={[styles.zoomBotao, { borderColor: cores.borda }]}><Text style={{ color: cores.texto }}>＋</Text></Pressable>
            </View> : null}
        </View>

        <View style={[styles.calendario, { borderColor: cores.borda, backgroundColor: cores.superficie }]}>
            <Calendar<EventoAgenda>
                events={eventos}
                height={visualizacao === 'schedule' ? 520 : 650}
                date={new Date(`${data}T12:00:00`)}
                mode={visualizacao}
                locale="pt-br"
                weekStartsOn={1}
                ampm={false}
                hourRowHeight={alturaHora}
                minHour={6}
                maxHour={23}
                scrollOffsetMinutes={7 * 60}
                swipeEnabled
                showTime
                eventsAreSorted
                theme={tema}
                eventCellStyle={(evento) => estiloEvento(evento.agendamento.status, cores)}
                eventCellAccessibilityProps={{ accessibilityRole: 'button' }}
                onPressEvent={(evento) => setSelecionado(evento.agendamento)}
                onSwipeEnd={(novaData) => alterarData(formatarData(novaData))}
                moreLabel="{moreCount} mais"
                calendarContainerStyle={{ backgroundColor: cores.superficie }}
                bodyContainerStyle={{ backgroundColor: cores.superficie }}
            />
        </View>
        <View style={styles.legenda}>
            <Legenda cor={cores.destaque} texto="Agendado" />
            <Legenda cor={cores.sucesso} texto="Confirmado" />
            <Legenda cor="#7C3AED" texto="Em atendimento" />
            <Legenda cor={cores.textoSecundario} texto="Finalizado" />
            <Legenda cor={cores.perigo} texto="Cancelado/ausente" />
        </View>
        {selecionado ? <View style={[styles.detalhes, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.detalhesCabecalho}>
                <View style={styles.detalhesTexto}><Text style={[styles.detalhesTitulo, { color: cores.texto }]}>{selecionado.usuario?.nome ?? 'Cliente'}</Text>
                    <Text style={[styles.detalhesMeta, { color: cores.textoSecundario }]}>{selecionado.profissional?.nome ?? 'Profissional'} · {new Date(selecionado.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                    <Text style={[styles.detalhesMeta, { color: cores.textoSecundario }]}>{selecionado.servicos?.map((servico) => servico.nome).join(' · ')}</Text></View>
                <Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes" onPress={() => setSelecionado(null)} style={[styles.fechar, { borderColor: cores.borda }]}><Text style={{ color: cores.texto }}>×</Text></Pressable>
            </View>
            <View style={styles.acoes}>{['CONFIRMADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW'].map((status) =>
                <Pressable key={status} onPress={async () => { if (await alterarStatus(selecionado.id, status)) setSelecionado((atual) => atual ? { ...atual, status } : atual) }}
                    style={[styles.acao, { borderColor: cores.borda }, selecionado.status === status && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}>
                    <Text style={[styles.acaoTexto, { color: selecionado.status === status ? cores.destaqueTexto : cores.texto }]}>{status.replace('_', ' ')}</Text>
                </Pressable>)}</View>
        </View> : null}
        <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>Deslize lateralmente para mudar o período. A linha vermelha indica o horário atual.</Text>
    </View>
}

function estiloEvento(status: string, cores: ReturnType<typeof useTema>['cores']) {
    const cor = status === 'CONFIRMADO' ? cores.sucesso
        : status === 'CHECKIN' ? '#7C3AED'
            : status === 'CONCLUIDO' ? cores.textoSecundario
                : ['CANCELADO', 'NO_SHOW'].includes(status) ? cores.perigo : cores.destaque
    return { backgroundColor: cor, borderColor: cor, borderRadius: 7 }
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
    return <View style={styles.legendaItem}><View style={[styles.legendaCor, { backgroundColor: cor }]} /><Text style={styles.legendaTexto}>{texto}</Text></View>
}

function formatarData(data: Date) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

const styles = StyleSheet.create({
    raiz: { gap: 10 }, barra: { gap: 8 }, visualizacoes: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' }, fuso: { fontSize: 11, fontWeight: '700' },
    chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
    chipTexto: { fontSize: 12, fontWeight: '800' }, zoom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
    zoomBotao: { width: 38, height: 34, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, zoomTexto: { fontSize: 12, fontWeight: '700' },
    calendario: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' }, legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, legendaCor: { width: 9, height: 9, borderRadius: 5 },
    legendaTexto: { color: '#64748B', fontSize: 11, fontWeight: '700' }, ajuda: { fontSize: 12, lineHeight: 17 },
    detalhes: { borderWidth: 1, borderRadius: 13, padding: 13, gap: 11 }, detalhesCabecalho: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    detalhesTexto: { flex: 1 }, detalhesTitulo: { fontSize: 16, fontWeight: '900' }, detalhesMeta: { marginTop: 4, lineHeight: 18 },
    fechar: { width: 34, height: 34, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, acao: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 7 },
    acaoTexto: { fontSize: 10, fontWeight: '800' },
})
