import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import { SeletorOperacao } from '@/src/components/operacao/ComponentesOperacao'
import { AtalhoCentralFinanceira, EquipeOperacao, ResumoOperacao } from '@/src/components/operacao/SecoesOperacao'
import useOperacao from '@/src/data/hooks/useOperacao'
import type { SecaoOperacao, VisualizacaoAgenda } from '@/src/data/operacao/tipos'
import { useState } from 'react'
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'
import { EscalasEquipe, MembrosEquipe } from '@/src/components/operacao/GestaoEquipe'
import GestaoRecursos from '@/src/components/operacao/GestaoRecursos'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AbasParamList, StackParamList } from '@/src/navigation/types'
import GestaoServicos from '@/src/components/operacao/GestaoServicos'
import useGestaoServicos from '@/src/data/hooks/useGestaoServicos'
import AgendaCalendario from '@/src/components/operacao/AgendaCalendario'

type Props = BottomTabScreenProps<AbasParamList, 'Operacao'>

export default function Operacao({ navigation }: Props) {
    const { cores } = useTema()
    const [secao, setSecao] = useState<SecaoOperacao>('RESUMO')
    const [visualizacaoAgenda, setVisualizacaoAgenda] = useState<VisualizacaoAgenda>('day')
    const [agendaTelaCheia, setAgendaTelaCheia] = useState(false)
    const dados = useOperacao(visualizacaoAgenda)
    const gestaoServicos = useGestaoServicos(secao === 'SERVICOS')
    const iniciarAgendamento = (dataSelecionada: Date) => {
        const data = new Date(dataSelecionada)
        // Preserva o dia e a hora da célula tocada. O arredondamento só atua
        // caso uma visualização futura forneça minutos fora da grade de 15 min.
        data.setSeconds(0, 0)
        data.setMinutes(Math.ceil(data.getMinutes() / 15) * 15)
        if (data.getTime() <= Date.now()) {
            Alert.alert('Horário indisponível', 'Selecione um horário futuro para criar o agendamento.')
            return
        }
        setAgendaTelaCheia(false)
        navigation.navigate('Agendamento', { dataInicial: data.toISOString(), origemAgenda: true, chave: Date.now() })
    }
    const cabecalho = <>
        <Text style={styles.sobretitulo}>OPERAÇÃO DO ESTABELECIMENTO</Text><Text style={[styles.titulo, { color: cores.texto }]}>Gestão diária</Text>
        <SeletorOperacao atual={secao} selecionar={setSecao} permissoes={dados.permissoes} />
    </>

    if (secao === 'AGENDA') {
        return <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['top']}>
            <View style={styles.conteudoAgenda}>
                {cabecalho}
                <NavegacaoData data={dados.data} alterar={dados.setData} visualizacao={visualizacaoAgenda} />
                {dados.erro ? <EstadoErro mensagem={dados.erro} tentarNovamente={dados.recarregar} /> : null}
                {dados.carregando && !dados.dashboard ? <Carregando mensagem="Carregando operação..." /> : null}
                {!dados.carregando ? <><Pressable accessibilityRole="button" accessibilityLabel="Abrir agenda em tela cheia" onPress={() => setAgendaTelaCheia(true)}
                    style={[styles.telaCheiaBotao, { borderColor: cores.borda, backgroundColor: cores.superficie }]}>
                    <Text style={[styles.telaCheiaTexto, { color: cores.texto }]}>⛶ Tela cheia</Text>
                </Pressable><AgendaCalendario itens={dados.agendamentos} restricoes={dados.restricoesAgenda}
                    profissionais={dados.profissionais} recursos={dados.recursos} filtros={dados.filtrosAgenda} alterarFiltros={dados.setFiltrosAgenda} data={dados.data}
                    visualizacao={visualizacaoAgenda} alterarVisualizacao={setVisualizacaoAgenda} alterarData={dados.setData}
                    aoPressionarCelula={iniciarAgendamento}
                    alterarStatus={dados.alterarStatus} reagendar={dados.reagendar} fusoHorario={dados.fusoHorario} /></> : null}
            </View>
            <Modal visible={agendaTelaCheia} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={() => setAgendaTelaCheia(false)}>
                <SafeAreaView style={[styles.telaCheia, { backgroundColor: cores.fundo }]} edges={['top', 'bottom']}>
                    <View style={styles.telaCheiaCabecalho}>
                        <View><Text style={styles.sobretitulo}>AGENDA OPERACIONAL</Text><Text style={[styles.telaCheiaTitulo, { color: cores.texto }]}>Visão ampliada</Text></View>
                        <Pressable accessibilityRole="button" accessibilityLabel="Sair da tela cheia" onPress={() => setAgendaTelaCheia(false)}
                            style={[styles.fecharTelaCheia, { borderColor: cores.borda, backgroundColor: cores.superficie }]}><Text style={{ color: cores.texto, fontSize: 22 }}>×</Text></Pressable>
                    </View>
                    <NavegacaoData data={dados.data} alterar={dados.setData} visualizacao={visualizacaoAgenda} />
                    <AgendaCalendario telaCheia itens={dados.agendamentos} restricoes={dados.restricoesAgenda}
                        profissionais={dados.profissionais} recursos={dados.recursos} filtros={dados.filtrosAgenda} alterarFiltros={dados.setFiltrosAgenda} data={dados.data}
                        visualizacao={visualizacaoAgenda} alterarVisualizacao={setVisualizacaoAgenda} alterarData={dados.setData}
                        aoPressionarCelula={iniciarAgendamento}
                        alterarStatus={dados.alterarStatus} reagendar={dados.reagendar} fusoHorario={dados.fusoHorario} />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    }

    return <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['top']}><ScrollView contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={dados.carregando} onRefresh={dados.recarregar} tintColor="#E7B84B" />}>
        {cabecalho}
        {dados.erro ? <EstadoErro mensagem={dados.erro} tentarNovamente={dados.recarregar} /> : null}
        {dados.carregando && !dados.dashboard ? <Carregando mensagem="Carregando operação..." /> : null}
        {!dados.carregando && secao === 'RESUMO' ? <ResumoOperacao dados={dados.dashboard} /> : null}
        {secao === 'SERVICOS' ? <GestaoServicos itens={gestaoServicos.servicos} profissionais={dados.profissionais} carregando={gestaoServicos.carregando}
            erro={gestaoServicos.erro} recarregar={gestaoServicos.carregar} salvar={gestaoServicos.salvar} excluir={gestaoServicos.excluir} /> : null}
        {!dados.carregando && secao === 'EQUIPE' ? <><EquipeOperacao itens={dados.profissionais} criar={dados.criarProfissional} /><EscalasEquipe profissionais={dados.profissionais} buscar={dados.buscarEscalas} salvar={dados.salvarEscalas} /><MembrosEquipe membros={dados.membros} usuarios={dados.usuariosDisponiveis} profissionais={dados.profissionais} salvar={dados.salvarMembro} criarPerfil={dados.criarPerfilParaMembro} remover={dados.removerMembro} /></> : null}
        {!dados.carregando && secao === 'CAPACIDADE' ? <GestaoRecursos itens={dados.recursos} criar={dados.criarRecurso} buscarIndisponibilidades={dados.buscarIndisponibilidades} indisponibilizar={dados.indisponibilizarRecurso} removerIndisponibilidade={dados.removerIndisponibilidade} /> : null}
        {!dados.carregando && secao === 'FINANCEIRO' ? <AtalhoCentralFinanceira
            abrir={() => navigation.getParent<NativeStackNavigationProp<StackParamList>>()?.navigate('CentralFinanceira')} /> : null}
    </ScrollView></SafeAreaView>
}

function NavegacaoData({ data, alterar, visualizacao }: { data: string; alterar: (data: string) => void; visualizacao: VisualizacaoAgenda }) {
    const { cores } = useTema()
    const mover = (dias: number) => {
        const atual = new Date(`${data}T12:00:00`)
        atual.setDate(atual.getDate() + dias)
        alterar(`${atual.getFullYear()}-${String(atual.getMonth() + 1).padStart(2, '0')}-${String(atual.getDate()).padStart(2, '0')}`)
    }
    const hoje = () => {
        const atual = new Date()
        alterar(`${atual.getFullYear()}-${String(atual.getMonth() + 1).padStart(2, '0')}-${String(atual.getDate()).padStart(2, '0')}`)
    }
    return <View style={styles.navegacaoData}>
        <View style={styles.acoesData}>
            <Pressable onPress={() => mover(-passoVisualizacao(visualizacao))} style={[styles.botaoData, { borderColor: cores.borda }]}><Text style={[styles.botaoDataTexto, { color: cores.texto }]}>‹ Anterior</Text></Pressable>
            <Pressable onPress={hoje} style={[styles.botaoData, { borderColor: cores.destaque }]}><Text style={[styles.botaoDataTexto, { color: cores.destaque }]}>Hoje</Text></Pressable>
            <Pressable onPress={() => mover(passoVisualizacao(visualizacao))} style={[styles.botaoData, { borderColor: cores.borda }]}><Text style={[styles.botaoDataTexto, { color: cores.texto }]}>Próximo ›</Text></Pressable>
        </View>
        <TextInput style={[styles.data, { backgroundColor: cores.campo, color: cores.campoTexto, borderColor: cores.borda }]} value={data} onChangeText={alterar} placeholder="AAAA-MM-DD" placeholderTextColor={cores.textoSecundario} />
    </View>
}

function passoVisualizacao(visualizacao: VisualizacaoAgenda) {
    return visualizacao === 'day' ? 1 : visualizacao === '3days' ? 3 : visualizacao === 'week' ? 7 : 31
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' }, conteudo: { padding: 18, paddingBottom: 40 }, conteudoAgenda: { flex: 1, paddingHorizontal: 18, paddingTop: 18 },
    sobretitulo: { color: '#E7B84B', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, titulo: { color: '#FFF', fontSize: 29, fontWeight: '900', marginTop: 6 },
    data: { backgroundColor: '#101E33', color: '#FFF', borderRadius: 11, padding: 13, borderWidth: 1, borderColor: '#31415A', marginBottom: 12 },
    navegacaoData: { gap: 9, marginBottom: 2 }, acoesData: { flexDirection: 'row', gap: 8 },
    botaoData: { flex: 1, minHeight: 42, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, botaoDataTexto: { fontSize: 12, fontWeight: '800' },
    telaCheiaBotao: { minHeight: 42, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }, telaCheiaTexto: { fontSize: 12, fontWeight: '900' },
    telaCheia: { flex: 1, paddingHorizontal: 12, paddingTop: 8 }, telaCheiaCabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    telaCheiaTitulo: { fontSize: 22, fontWeight: '900', marginTop: 2 }, fecharTelaCheia: { width: 44, height: 44, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
})
