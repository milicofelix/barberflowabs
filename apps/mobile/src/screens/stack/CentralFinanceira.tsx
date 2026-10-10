import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import useTema from '@/src/data/contexts/ContextoTema'
import useFinanceiro from '@/src/data/hooks/useFinanceiro'
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const MODULOS = [
    ['Contas', 'Contas a pagar e receber'], ['Caixa', 'Abertura, fechamento e histórico'],
    ['Comissões', 'Regras por profissional e serviço'], ['Repasses', 'Cálculo e pagamento'],
    ['Pagamentos', 'Formas de pagamento e assinatura'], ['Conciliação', 'Divergências e conferência'],
] as const

export default function CentralFinanceira() {
    const { cores } = useTema()
    const financeiro = useFinanceiro()

    if (financeiro.carregando && !financeiro.resumo) return <Carregando mensagem="Carregando central financeira..." />

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['bottom']}>
            <ScrollView
                contentContainerStyle={styles.conteudo}
                refreshControl={<RefreshControl refreshing={financeiro.carregando} onRefresh={financeiro.recarregar} tintColor={cores.destaque} />}
            >
                <Text style={[styles.sobretitulo, { color: cores.destaque }]}>GESTÃO FINANCEIRA</Text>
                <Text style={[styles.titulo, { color: cores.texto }]}>Central financeira</Text>
                <Text style={[styles.descricao, { color: cores.textoSecundario }]}>Dados e ações respeitam as permissões da equipe e o estabelecimento atual.</Text>

                {financeiro.erro ? <EstadoErro mensagem={financeiro.erro} tentarNovamente={financeiro.recarregar} /> : null}
                {!financeiro.erro ? (!financeiro.podeVisualizar ? (
                    <View style={[styles.aviso, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                        <Text style={[styles.avisoTitulo, { color: cores.texto }]}>Acesso restrito</Text>
                        <Text style={{ color: cores.textoSecundario }}>Solicite a permissão “Visualizar financeiro” ao responsável pelo estabelecimento.</Text>
                    </View>
                ) : (
                    <>
                        <View style={[styles.periodo, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                            <CampoData label="Início" value={financeiro.inicio} onChangeText={financeiro.setInicio} />
                            <CampoData label="Fim" value={financeiro.fim} onChangeText={financeiro.setFim} />
                        </View>
                        {financeiro.sucesso ? <FeedbackSucesso mensagem={financeiro.sucesso} /> : null}
                        <View style={styles.grade}>
                            {MODULOS.map(([titulo, descricao]) => (
                                <View key={titulo} style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                                    <Text style={[styles.cartaoTitulo, { color: cores.texto }]}>{titulo}</Text>
                                    <Text style={[styles.cartaoDescricao, { color: cores.textoSecundario }]}>{descricao}</Text>
                                    <Text style={[styles.estado, { color: cores.destaque }]}>Fundação conectada</Text>
                                </View>
                            ))}
                            {financeiro.podeAuditar ? (
                                <View style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                                    <Text style={[styles.cartaoTitulo, { color: cores.texto }]}>Auditoria</Text>
                                    <Text style={[styles.cartaoDescricao, { color: cores.textoSecundario }]}>Trilha financeira protegida por permissão.</Text>
                                    <Text style={[styles.estado, { color: cores.destaque }]}>{financeiro.auditoria.length} evento(s)</Text>
                                </View>
                            ) : null}
                        </View>
                        {!financeiro.podeGerenciar ? <Text style={[styles.somenteLeitura, { color: cores.textoSecundario }]}>Acesso somente para visualização.</Text> : null}
                    </>
                )) : null}
            </ScrollView>
        </SafeAreaView>
    )

    function CampoData(props: { label: string; value: string; onChangeText: (valor: string) => void }) {
        return <View style={styles.campo}><Text style={[styles.rotulo, { color: cores.textoSecundario }]}>{props.label}</Text><TextInput
            style={[styles.input, { backgroundColor: cores.campo, borderColor: cores.borda, color: cores.campoTexto }]}
            defaultValue={props.value} onEndEditing={(evento) => props.onChangeText(evento.nativeEvent.text)}
            placeholder="AAAA-MM-DD" placeholderTextColor={cores.textoSecundario} returnKeyType="done"
        /></View>
    }
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 }, conteudo: { padding: 18, paddingBottom: 42, gap: 14 },
    sobretitulo: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, titulo: { fontSize: 29, fontWeight: '900' },
    descricao: { fontSize: 15, lineHeight: 21 }, periodo: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 14, padding: 14 },
    campo: { flex: 1, gap: 5 }, rotulo: { fontSize: 12, fontWeight: '700' }, input: { borderWidth: 1, borderRadius: 10, padding: 11 },
    grade: { gap: 10 }, cartao: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 5 }, cartaoTitulo: { fontSize: 17, fontWeight: '800' },
    cartaoDescricao: { lineHeight: 19 }, estado: { marginTop: 5, fontSize: 12, fontWeight: '800' },
    aviso: { borderWidth: 1, borderRadius: 14, padding: 18, gap: 7 }, avisoTitulo: { fontSize: 18, fontWeight: '800' }, somenteLeitura: { textAlign: 'center', fontSize: 13 },
})
