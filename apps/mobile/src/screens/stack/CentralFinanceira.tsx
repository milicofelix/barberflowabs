import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import PeriodoFinanceiro from '@/src/components/financeiro/PeriodoFinanceiro'
import ResumoFinanceiro from '@/src/components/financeiro/ResumoFinanceiro'
import ContasFinanceiras from '@/src/components/financeiro/ContasFinanceiras'
import FormularioContaFinanceira from '@/src/components/financeiro/FormularioContaFinanceira'
import CaixaFinanceiro from '@/src/components/financeiro/CaixaFinanceiro'
import FormasPagamento from '@/src/components/financeiro/FormasPagamento'
import ComissoesFinanceiras from '@/src/components/financeiro/ComissoesFinanceiras'
import RepassesFinanceiros from '@/src/components/financeiro/RepassesFinanceiros'
import AssinaturaFinanceira from '@/src/components/financeiro/AssinaturaFinanceira'
import ConciliacoesFinanceiras from '@/src/components/financeiro/ConciliacoesFinanceiras'
import AuditoriaFinanceira from '@/src/components/financeiro/AuditoriaFinanceira'
import useTema from '@/src/data/contexts/ContextoTema'
import useFinanceiro from '@/src/data/hooks/useFinanceiro'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
                        <PeriodoFinanceiro inicio={financeiro.inicio} fim={financeiro.fim}
                            selecionar={(inicio, fim) => { financeiro.setInicio(inicio); financeiro.setFim(fim) }} />
                        {financeiro.sucesso ? <FeedbackSucesso mensagem={financeiro.sucesso} /> : null}
                        <ResumoFinanceiro resumo={financeiro.resumo} />
                        <Text style={[styles.secaoTitulo, { color: cores.texto }]}>Contas a pagar e receber</Text>
                        {financeiro.podeGerenciar ? <FormularioContaFinanceira executando={financeiro.executando} salvar={financeiro.criarConta} /> : null}
                        <ContasFinanceiras contas={financeiro.contas} formasPagamento={financeiro.formasPagamento} podeGerenciar={financeiro.podeGerenciar}
                            executando={financeiro.executando} baixar={financeiro.baixarConta} cancelar={financeiro.cancelarConta} />
                        <Text style={[styles.secaoTitulo, { color: cores.texto }]}>Caixa</Text>
                        <CaixaFinanceiro caixas={financeiro.caixas} podeGerenciar={financeiro.podeGerenciar} executando={financeiro.executando}
                            abrir={financeiro.abrirCaixa} fechar={financeiro.fecharCaixa} />
                        <Text style={[styles.secaoTitulo, { color: cores.texto }]}>Formas de pagamento</Text>
                        <FormasPagamento formas={financeiro.formasPagamento} podeGerenciar={financeiro.podeGerenciar} executando={financeiro.executando}
                            salvar={financeiro.salvarFormaPagamento} />
                        <Text style={[styles.secaoTitulo, { color: cores.texto }]}>Comissões</Text>
                        <ComissoesFinanceiras regras={financeiro.comissoes} profissionais={financeiro.profissionais} servicos={financeiro.servicos}
                            podeGerenciar={financeiro.podeGerenciar} executando={financeiro.executando} salvar={financeiro.salvarComissao} />
                        <Text style={[styles.secaoTitulo, { color: cores.texto }]}>Repasses</Text>
                        <RepassesFinanceiros repasses={financeiro.repasses} inicio={financeiro.inicio} fim={financeiro.fim}
                            podeGerenciar={financeiro.podeGerenciar} executando={financeiro.executando} calcular={financeiro.calcularRepasses} pagar={financeiro.pagarRepasse} />
                        <Text style={[styles.secaoTitulo, { color: cores.texto }]}>Assinatura e cobranças</Text>
                        <AssinaturaFinanceira assinatura={financeiro.assinatura} podeGerenciar={financeiro.podeGerenciar}
                            executando={financeiro.executando} gerarCobranca={financeiro.gerarCobranca} />
                        <Text style={[styles.secaoTitulo, { color: cores.texto }]}>Conciliação</Text>
                        <ConciliacoesFinanceiras conciliacoes={financeiro.conciliacoes} contas={financeiro.contas} podeGerenciar={financeiro.podeGerenciar}
                            executando={financeiro.executando} salvar={financeiro.conciliar} />
                        {financeiro.podeAuditar ? <><Text style={[styles.secaoTitulo, { color: cores.texto }]}>Auditoria financeira</Text>
                            <AuditoriaFinanceira eventos={financeiro.auditoria} /></> : null}
                        {!financeiro.podeGerenciar ? <Text style={[styles.somenteLeitura, { color: cores.textoSecundario }]}>Acesso somente para visualização.</Text> : null}
                    </>
                )) : null}
            </ScrollView>
        </SafeAreaView>
    )

}

const styles = StyleSheet.create({
    safeArea: { flex: 1 }, conteudo: { padding: 18, paddingBottom: 42, gap: 14 },
    sobretitulo: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, titulo: { fontSize: 29, fontWeight: '900' },
    descricao: { fontSize: 15, lineHeight: 21 }, secaoTitulo: { fontSize: 17, fontWeight: '900', marginTop: 4 },
    aviso: { borderWidth: 1, borderRadius: 14, padding: 18, gap: 7 }, avisoTitulo: { fontSize: 18, fontWeight: '800' }, somenteLeitura: { textAlign: 'center', fontSize: 13 },
})
