import type { HorarioFuncionamento } from '@/src/data/hooks/useConfiguracoesEstabelecimento'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Props {
    horarios: HorarioFuncionamento[]
    alterar: (horarios: HorarioFuncionamento[]) => void
}

export default function HorariosAgenda({ horarios, alterar }: Props) {
    const { cores } = useTema()
    function atualizar(indice: number, campo: keyof HorarioFuncionamento, valor: string | boolean) {
        alterar(horarios.map((horario, atual) => atual === indice ? { ...horario, [campo]: valor } : horario))
    }

    function adicionar(diaSemana: number) {
        alterar([...horarios, { diaSemana, inicio: '09:00', fim: '18:00', ativo: true }])
    }

    function remover(diaSemana: number) {
        alterar(horarios.filter((horario) => horario.diaSemana !== diaSemana))
    }

    const diasDisponiveis = [1, 2, 3, 4, 5, 6, 0].filter((dia) => !horarios.some((horario) => horario.diaSemana === dia))

    return <View style={styles.conteudo}>
        {horarios.map((horario, indice) => <View key={horario.id ?? horario.diaSemana} style={{ gap: 8 }}><View style={styles.linha}>
            <Pressable onPress={() => atualizar(indice, 'ativo', horario.ativo === false)} style={[styles.dia, horario.ativo !== false && styles.diaAtivo]}>
                <Text style={styles.diaTexto}>{DIAS[horario.diaSemana]}</Text>
            </Pressable>
            <TextInput value={horario.inicio} onChangeText={(valor) => atualizar(indice, 'inicio', valor)} style={[styles.horario, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} maxLength={5} keyboardType="numbers-and-punctuation" />
            <Text style={[styles.separador, { color: cores.textoSecundario }]}>até</Text>
            <TextInput value={horario.fim} onChangeText={(valor) => atualizar(indice, 'fim', valor)} style={[styles.horario, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} maxLength={5} keyboardType="numbers-and-punctuation" />
            <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${DIAS[horario.diaSemana]}`} onPress={() => remover(horario.diaSemana)} style={[styles.remover, { borderColor: cores.borda }]}>
                <Text style={styles.removerTexto}>×</Text>
            </Pressable>
        </View>
            <Text style={{ color: cores.textoSecundario }}>Intervalo opcional — vazio significa sem pausa fixa</Text>
            <View style={styles.linha}>
                <TextInput accessibilityLabel={`Início do intervalo de ${DIAS[horario.diaSemana]}`} placeholder="HH:MM" placeholderTextColor={cores.textoSecundario} value={horario.intervaloInicio ?? ''} onChangeText={(valor) => atualizar(indice, 'intervaloInicio', valor)} style={[styles.horario, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} maxLength={5} keyboardType="numbers-and-punctuation" />
                <Text style={{ color: cores.textoSecundario }}>até</Text>
                <TextInput accessibilityLabel={`Fim do intervalo de ${DIAS[horario.diaSemana]}`} placeholder="HH:MM" placeholderTextColor={cores.textoSecundario} value={horario.intervaloFim ?? ''} onChangeText={(valor) => atualizar(indice, 'intervaloFim', valor)} style={[styles.horario, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} maxLength={5} keyboardType="numbers-and-punctuation" />
                <Pressable accessibilityRole="button" onPress={() => alterar(horarios.map((item, atual) => atual === indice ? { ...item, intervaloInicio: null, intervaloFim: null } : item))} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: cores.destaque }}>Sem pausa</Text></Pressable>
            </View>
        </View>)}
        {!horarios.length ? <Text style={[styles.vazio, { color: cores.textoSecundario }]}>Nenhum dia de funcionamento configurado.</Text> : null}
        {diasDisponiveis.length ? <View style={styles.diasDisponiveis}>
            <Text style={[styles.vazio, { color: cores.textoSecundario }]}>Adicionar dia:</Text>
            {diasDisponiveis.map((dia) => <Pressable key={dia} onPress={() => adicionar(dia)} style={[styles.adicionar, { borderColor: cores.borda }]}>
                <Text style={styles.adicionarTexto}>+ {DIAS[dia]}</Text>
            </Pressable>)}
        </View> : null}
    </View>
}

const styles = StyleSheet.create({
    conteudo: { gap: 8 }, linha: { flexDirection: 'row', alignItems: 'center', gap: 7 }, dia: { width: 44, paddingVertical: 9, borderRadius: 9, backgroundColor: '#344054', alignItems: 'center', opacity: 0.55 }, diaAtivo: { backgroundColor: '#E7B84B', opacity: 1 }, diaTexto: { color: '#081426', fontWeight: '900', fontSize: 12 },
    horario: { flex: 1, color: '#FFF', backgroundColor: '#081426', borderWidth: 1, borderColor: '#43516A', borderRadius: 9, padding: 10, textAlign: 'center' }, separador: { color: '#AEBBCE', fontSize: 12 }, adicionar: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' }, adicionarTexto: { color: '#E7B84B', fontWeight: '800' },
    remover: { width: 38, height: 38, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, removerTexto: { color: '#DC2626', fontSize: 25, lineHeight: 27, fontWeight: '700' },
    diasDisponiveis: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginTop: 5 }, vazio: { fontSize: 12 },
})
