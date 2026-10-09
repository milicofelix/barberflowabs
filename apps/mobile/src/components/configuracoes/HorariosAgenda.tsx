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

    function adicionar() {
        const diaSemana = [1, 2, 3, 4, 5, 6, 0].find((dia) => !horarios.some((horario) => horario.diaSemana === dia))
        if (diaSemana === undefined) return
        alterar([...horarios, { diaSemana, inicio: '09:00', fim: '18:00', ativo: true }])
    }

    return <View style={styles.conteudo}>
        {horarios.map((horario, indice) => <View key={horario.id ?? horario.diaSemana} style={styles.linha}>
            <Pressable onPress={() => atualizar(indice, 'ativo', horario.ativo === false)} style={[styles.dia, horario.ativo !== false && styles.diaAtivo]}>
                <Text style={styles.diaTexto}>{DIAS[horario.diaSemana]}</Text>
            </Pressable>
            <TextInput value={horario.inicio} onChangeText={(valor) => atualizar(indice, 'inicio', valor)} style={[styles.horario, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} maxLength={5} keyboardType="numbers-and-punctuation" />
            <Text style={[styles.separador, { color: cores.textoSecundario }]}>até</Text>
            <TextInput value={horario.fim} onChangeText={(valor) => atualizar(indice, 'fim', valor)} style={[styles.horario, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} maxLength={5} keyboardType="numbers-and-punctuation" />
        </View>)}
        {horarios.length < 7 ? <Pressable onPress={adicionar} style={styles.adicionar}><Text style={styles.adicionarTexto}>+ Adicionar dia de funcionamento</Text></Pressable> : null}
    </View>
}

const styles = StyleSheet.create({
    conteudo: { gap: 8 }, linha: { flexDirection: 'row', alignItems: 'center', gap: 7 }, dia: { width: 44, paddingVertical: 9, borderRadius: 9, backgroundColor: '#344054', alignItems: 'center', opacity: 0.55 }, diaAtivo: { backgroundColor: '#E7B84B', opacity: 1 }, diaTexto: { color: '#081426', fontWeight: '900', fontSize: 12 },
    horario: { flex: 1, color: '#FFF', backgroundColor: '#081426', borderWidth: 1, borderColor: '#43516A', borderRadius: 9, padding: 10, textAlign: 'center' }, separador: { color: '#AEBBCE', fontSize: 12 }, adicionar: { paddingVertical: 10, alignItems: 'center' }, adicionarTexto: { color: '#E7B84B', fontWeight: '800' },
})
