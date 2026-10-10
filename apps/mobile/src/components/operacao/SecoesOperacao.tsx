import CampoTexto from '@/src/components/shared/CampoTexto'
import type {
    AgendamentoOperacional, DashboardOperacional, ProfissionalOperacional,
} from '@/src/data/operacao/tipos'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CartaoMetrica, moeda } from './ComponentesOperacao'
import useTema from '@/src/data/contexts/ContextoTema'

export function ResumoOperacao({ dados }: { dados: DashboardOperacional | null }) {
    if (!dados) return null
    return <View style={styles.grade}>
        <CartaoMetrica titulo="Agendamentos hoje" valor={dados.agendamentosHoje} />
        <CartaoMetrica titulo="Clientes" valor={dados.clientes} />
        <CartaoMetrica titulo="Receita hoje" valor={moeda(dados.receitaHoje)} destaque />
        <CartaoMetrica titulo="Saldo do mês" valor={moeda(dados.saldoMes)} destaque />
    </View>
}

export function AgendaOperacao({ itens, alterarStatus }: {
    itens: AgendamentoOperacional[]; alterarStatus: (id: number, status: string) => Promise<boolean>
}) {
    const { cores } = useTema()
    const [profissionalId, setProfissionalId] = useState<number | null>(null)
    const profissionais = Array.from(new Map(itens.filter((item) => item.profissional).map((item) => [item.profissional!.id, item.profissional!])).values())
    const agenda = profissionalId ? itens.filter((item) => item.profissional?.id === profissionalId) : itens
    return <View style={styles.lista}><View style={styles.filtrosAgenda}>
        <Pressable onPress={() => setProfissionalId(null)} style={[styles.chip, { borderColor: cores.borda }, profissionalId === null && styles.chipAtivo]}><Text style={[styles.chipTexto, { color: cores.texto }]}>TODOS</Text></Pressable>
        {profissionais.map((profissional) => <Pressable key={profissional.id} onPress={() => setProfissionalId(profissional.id)} style={[styles.chip, { borderColor: cores.borda }, profissionalId === profissional.id && styles.chipAtivo]}><Text style={[styles.chipTexto, { color: cores.texto }]}>{profissional.nome.toUpperCase()}</Text></Pressable>)}
    </View>{agenda.map((item) => <View key={item.id} style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <Text style={[styles.titulo, { color: cores.texto }]}>{item.usuario?.nome ?? 'Cliente'}</Text>
        <Text style={[styles.descricao, { color: cores.textoSecundario }]}>{item.profissional?.nome ?? 'Profissional'} · {new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
        <Text style={[styles.descricao, { color: cores.textoSecundario }]}>{item.servicos?.map((servico) => servico.nome).join(' · ')}</Text>
        <View style={styles.acoes}>{['CONFIRMADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO', 'NO_SHOW'].map((status) =>
            <Pressable key={status} onPress={() => alterarStatus(item.id, status)} style={[styles.chip, { borderColor: cores.borda }, item.status === status && styles.chipAtivo]}>
                <Text style={[styles.chipTexto, { color: cores.texto }]}>{status.replace('_', ' ')}</Text></Pressable>)}</View>
    </View>)}</View>
}

export function EquipeOperacao({ itens, criar }: {
    itens: ProfissionalOperacional[]; criar: (dados: Omit<ProfissionalOperacional, 'id'>) => Promise<boolean>
}) {
    const { cores } = useTema()
    const [nome, setNome] = useState(''); const [descricao, setDescricao] = useState(''); const [salvando, setSalvando] = useState(false)
    async function submeter() {
        if (!nome.trim() || !descricao.trim() || salvando) return
        try {
            setSalvando(true)
            const criado = await criar({ nome: nome.trim(), descricao: descricao.trim(), imagemURL: '/profissionais/profissional-1.jpg' })
            if (criado) { setNome(''); setDescricao('') }
        }
        finally { setSalvando(false) }
    }
    return <View style={styles.lista}><View style={[styles.formulario, { backgroundColor: cores.superficie }]}><Text style={[styles.subtitulo, { color: cores.texto }]}>Adicionar profissional</Text>
        <CampoTexto label="Nome" value={nome} onChangeText={setNome} /><CampoTexto label="Apresentação" value={descricao} onChangeText={setDescricao} />
        <Botao texto={salvando ? 'Salvando...' : 'Adicionar à equipe'} acao={submeter} /></View>
        {itens.map((item) => <View key={item.id} style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.titulo, { color: cores.texto }]}>{item.nome}</Text>
            <Text style={[styles.descricao, { color: cores.textoSecundario }]}>{item.descricao}</Text><Text style={styles.meta}>★ {Number(item.avaliacao ?? 5).toFixed(1)}</Text></View>)}</View>
}

export function AtalhoCentralFinanceira({ abrir }: { abrir: () => void }) {
    const { cores } = useTema()
    return <View style={[styles.atalhoFinanceiro, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <Text style={[styles.subtitulo, { color: cores.texto }]}>Central financeira</Text>
        <Text style={[styles.descricao, { color: cores.textoSecundario }]}>Contas, caixa, comissões, repasses, cobranças, conciliação e auditoria estão reunidos em um único fluxo.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir central financeira" style={styles.botao} onPress={abrir}><Text style={styles.botaoTexto}>Abrir central financeira</Text></Pressable>
    </View>
}

function Botao({ texto, acao }: { texto: string; acao: () => void }) {
    return <Pressable style={styles.botao} onPress={acao}><Text style={styles.botaoTexto}>{texto}</Text></Pressable>
}

const styles = StyleSheet.create({
    grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, lista: { gap: 10 }, cartao: { backgroundColor: '#101E33', borderRadius: 13, padding: 14, borderWidth: 1, borderColor: '#26364E' },
    titulo: { color: '#FFF', fontSize: 16, fontWeight: '800' }, subtitulo: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 8 }, descricao: { color: '#AEBBCE', marginTop: 5, lineHeight: 19 }, meta: { color: '#E7B84B', marginTop: 8 },
    acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }, chip: { borderWidth: 1, borderColor: '#43516A', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 7 }, chipAtivo: { borderColor: '#E7B84B', backgroundColor: '#493B16' }, chipTexto: { color: '#E7EAF0', fontSize: 10, fontWeight: '800' },
    filtrosAgenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 4 }, formulario: { backgroundColor: '#101E33', borderRadius: 14, padding: 15, gap: 7, marginBottom: 5 }, botao: { minHeight: 46, backgroundColor: '#E7B84B', borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, botaoTexto: { color: '#081426', fontWeight: '900' },
    atalhoFinanceiro: { borderWidth: 1, borderRadius: 14, padding: 16 },
})
