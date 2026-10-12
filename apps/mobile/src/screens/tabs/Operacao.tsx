import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import { SeletorOperacao } from '@/src/components/operacao/ComponentesOperacao'
import { AgendaOperacao, AtalhoCentralFinanceira, EquipeOperacao, ResumoOperacao } from '@/src/components/operacao/SecoesOperacao'
import useOperacao from '@/src/data/hooks/useOperacao'
import type { SecaoOperacao } from '@/src/data/operacao/tipos'
import { useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'
import { EscalasEquipe, MembrosEquipe } from '@/src/components/operacao/GestaoEquipe'
import GestaoRecursos from '@/src/components/operacao/GestaoRecursos'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AbasParamList, StackParamList } from '@/src/navigation/types'
import GestaoServicos from '@/src/components/operacao/GestaoServicos'
import useGestaoServicos from '@/src/data/hooks/useGestaoServicos'

type Props = BottomTabScreenProps<AbasParamList, 'Operacao'>

export default function Operacao({ navigation }: Props) {
    const { cores } = useTema()
    const [secao, setSecao] = useState<SecaoOperacao>('RESUMO')
    const dados = useOperacao()
    const gestaoServicos = useGestaoServicos(secao === 'SERVICOS')
    return <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['top']}><ScrollView contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={dados.carregando} onRefresh={dados.recarregar} tintColor="#E7B84B" />}>
        <Text style={styles.sobretitulo}>OPERAÇÃO DO ESTABELECIMENTO</Text><Text style={[styles.titulo, { color: cores.texto }]}>Gestão diária</Text>
        <SeletorOperacao atual={secao} selecionar={setSecao} permissoes={dados.permissoes} />
        {secao === 'AGENDA' ? <TextInput style={[styles.data, { backgroundColor: cores.campo, color: cores.campoTexto, borderColor: cores.borda }]} value={dados.data} onChangeText={dados.setData} placeholder="AAAA-MM-DD" placeholderTextColor={cores.textoSecundario} /> : null}
        {dados.erro ? <EstadoErro mensagem={dados.erro} tentarNovamente={dados.recarregar} /> : null}
        {dados.carregando && !dados.dashboard ? <Carregando mensagem="Carregando operação..." /> : null}
        {!dados.carregando && secao === 'RESUMO' ? <ResumoOperacao dados={dados.dashboard} /> : null}
        {!dados.carregando && secao === 'AGENDA' ? (dados.agendamentos.length ? <AgendaOperacao itens={dados.agendamentos} alterarStatus={dados.alterarStatus} /> : <EstadoVazio titulo="Agenda livre nesta data" />) : null}
        {secao === 'SERVICOS' ? <GestaoServicos itens={gestaoServicos.servicos} profissionais={dados.profissionais} carregando={gestaoServicos.carregando}
            erro={gestaoServicos.erro} recarregar={gestaoServicos.carregar} salvar={gestaoServicos.salvar} excluir={gestaoServicos.excluir} /> : null}
        {!dados.carregando && secao === 'EQUIPE' ? <><EquipeOperacao itens={dados.profissionais} criar={dados.criarProfissional} /><EscalasEquipe profissionais={dados.profissionais} buscar={dados.buscarEscalas} salvar={dados.salvarEscalas} /><MembrosEquipe membros={dados.membros} usuarios={dados.usuariosDisponiveis} profissionais={dados.profissionais} salvar={dados.salvarMembro} criarPerfil={dados.criarPerfilParaMembro} remover={dados.removerMembro} /></> : null}
        {!dados.carregando && secao === 'CAPACIDADE' ? <GestaoRecursos itens={dados.recursos} criar={dados.criarRecurso} buscarIndisponibilidades={dados.buscarIndisponibilidades} indisponibilizar={dados.indisponibilizarRecurso} removerIndisponibilidade={dados.removerIndisponibilidade} /> : null}
        {!dados.carregando && secao === 'FINANCEIRO' ? <AtalhoCentralFinanceira
            abrir={() => navigation.getParent<NativeStackNavigationProp<StackParamList>>()?.navigate('CentralFinanceira')} /> : null}
    </ScrollView></SafeAreaView>
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' }, conteudo: { padding: 18, paddingBottom: 40 },
    sobretitulo: { color: '#E7B84B', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, titulo: { color: '#FFF', fontSize: 29, fontWeight: '900', marginTop: 6 },
    data: { backgroundColor: '#101E33', color: '#FFF', borderRadius: 11, padding: 13, borderWidth: 1, borderColor: '#31415A', marginBottom: 12 },
})
