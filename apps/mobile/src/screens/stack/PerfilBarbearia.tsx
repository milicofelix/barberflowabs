import DenunciaPerfil from '@/src/components/barbearias/DenunciaPerfil'
import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import type { EstabelecimentoPerfil } from '@/src/data/barbearias/tipos'
import { resumirSelecao } from '@/src/data/barbearias/tipos'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useBarbearia from '@/src/data/hooks/useBarbearia'
import type { StackParamList } from '@/src/navigation/types'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'

type Props = NativeStackScreenProps<StackParamList, 'PerfilBarbearia'>
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function PerfilBarbearia({ route, navigation }: Props) {
    const { cores } = useTema()
    const { httpGet } = useAPI()
    const { barbearia: selecionada, selecionarBarbearia } = useBarbearia()
    const [barbearia, setBarbearia] = useState<EstabelecimentoPerfil | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [selecionando, setSelecionando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [denunciaAberta, setDenunciaAberta] = useState(false)

    const carregar = useCallback(async () => {
        try {
            setCarregando(true)
            setErro(null)
            setBarbearia(await httpGet<EstabelecimentoPerfil>(`/public/estabelecimentos/${encodeURIComponent(route.params.slug)}`, {
                escopoTenant: 'nenhum',
            }))
        } catch (e) {
            setBarbearia(null)
            setErro(mensagemDoErro(e))
        } finally {
            setCarregando(false)
        }
    }, [httpGet, route.params.slug])

    useEffect(() => { carregar() }, [carregar])

    async function agendarAqui() {
        if (!barbearia || selecionando) return
        try {
            setSelecionando(true)
            await selecionarBarbearia(resumirSelecao(barbearia))
            navigation.navigate('Abas', { screen: 'Agendamento' })
        } catch {
            setErro('Não foi possível salvar sua barbearia. Tente novamente.')
        } finally {
            setSelecionando(false)
        }
    }

    if (carregando) return <Carregando mensagem="Carregando perfil do estabelecimento..." />
    if (erro || !barbearia) return <SafeAreaView style={[styles.telaEstado, { backgroundColor: cores.fundo }]}><EstadoErro mensagem={erro ?? 'Estabelecimento não encontrado.'} tentarNovamente={carregar} /></SafeAreaView>

    const endereco = [barbearia.endereco?.logradouro, barbearia.endereco?.bairro, barbearia.endereco?.cidade, barbearia.endereco?.estado].filter(Boolean).join(' · ')
    const imagem = barbearia.imagemCapaURL?.startsWith('http') ? { uri: barbearia.imagemCapaURL } : require('@/assets/images/inicio/fundo.png')
    const estaSelecionada = selecionada?.id === barbearia.id

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.conteudo}>
                <ImageBackground source={imagem} style={styles.hero} imageStyle={styles.heroImagem}>
                    <View style={styles.heroOverlay}>
                        <Text style={[styles.status, barbearia.statusOperacional?.status === 'ABERTA' && styles.statusAberta]}>{barbearia.statusOperacional?.label}</Text>
                        <View>
                            <Text style={styles.nome}>{barbearia.nome}</Text>
                            {barbearia.descricao ? <Text style={styles.descricao}>{barbearia.descricao}</Text> : null}
                        </View>
                    </View>
                </ImageBackground>

                <View style={[styles.informacoes, { borderBottomColor: cores.borda }]}>
                    {barbearia.avaliacaoMedia != null ? <Info icone="star" texto={`${barbearia.avaliacaoMedia} · ${barbearia.quantidadeAvaliacoes} avaliações`} /> : null}
                    {endereco ? <Info icone="location-outline" texto={endereco} /> : null}
                    {barbearia.telefone ? <Info icone="call-outline" texto={barbearia.telefone} /> : null}
                    {barbearia.segmentos?.length ? <Info icone="sparkles-outline" texto={barbearia.segmentos.map((item) => item.nome).join(' · ')} /> : null}
                    {estaSelecionada ? <View style={styles.selecionada}><Ionicons name="checkmark-circle" size={20} color="#48C78E" /><Text style={styles.selecionadaTexto}>Estabelecimento selecionado</Text></View> : null}
                </View>

                <Secao titulo="Serviços">
                    {barbearia.servicos.length ? barbearia.servicos.map((servico) => (
                        <View key={servico.id} style={[styles.itemCard, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                            <View style={styles.itemCabecalho}><Text style={[styles.itemTitulo, { color: cores.texto }]}>{servico.nome}</Text><Text style={styles.preco}>{moeda(servico.preco)}</Text></View>
                            {servico.descricao ? <Text style={[styles.itemDescricao, { color: cores.textoSecundario }]}>{servico.descricao}</Text> : null}
                            <Text style={[styles.itemMeta, { color: cores.textoSecundario }]}>{servico.duracaoMinutos} minutos</Text>
                        </View>
                    )) : <EstadoVazio titulo="Nenhum serviço disponível" descricao="O estabelecimento ainda não publicou seus serviços." />}
                </Secao>

                <Secao titulo="Profissionais">
                    {barbearia.profissionais.length ? barbearia.profissionais.map((profissional) => (
                        <View key={profissional.id} style={[styles.itemCard, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                            <Text style={[styles.itemTitulo, { color: cores.texto }]}>{profissional.nome}</Text>
                            {profissional.descricao ? <Text style={styles.itemDescricao}>{profissional.descricao}</Text> : null}
                            {profissional.avaliacao != null ? <Text style={styles.itemMeta}>★ {Number(profissional.avaliacao).toFixed(1)} · {profissional.quantidadeAvaliacoes ?? 0} avaliações</Text> : null}
                        </View>
                    )) : <EstadoVazio titulo="Nenhum profissional publicado" />}
                </Secao>

                <Secao titulo="Horários">
                    <View style={[styles.itemCard, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                        {barbearia.horariosFuncionamento.length ? barbearia.horariosFuncionamento.map((horario) => (
                            <View key={horario.diaSemana} style={styles.horarioLinha}>
                                <Text style={styles.horarioDia}>{DIAS[horario.diaSemana] ?? '-'}</Text>
                                <Text style={[styles.horarioValor, { color: cores.texto }]}>{horario.inicio} às {horario.fim}</Text>
                            </View>
                        )) : <Text style={styles.itemDescricao}>Horários ainda não configurados.</Text>}
                    </View>
                </Secao>

                <Secao titulo="Avaliações">
                    {barbearia.avaliacoes.length ? barbearia.avaliacoes.map((avaliacao) => (
                        <View key={avaliacao.id} style={[styles.itemCard, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                            <Text style={styles.avaliacaoNota}>{'★'.repeat(Math.max(1, Math.min(5, Math.round(avaliacao.nota))))}</Text>
                            <Text style={styles.itemDescricao}>{avaliacao.comentario || 'Cliente não deixou comentário.'}</Text>
                            <Text style={styles.itemMeta}>{avaliacao.cliente ?? 'Cliente'} · {avaliacao.profissional ?? 'Profissional'}</Text>
                        </View>
                    )) : <EstadoVazio titulo="Ainda não há avaliações" />}
                </Secao>

                <Pressable style={styles.reportar} onPress={() => setDenunciaAberta(true)}>
                    <Ionicons name="flag-outline" size={18} color="#AEBBCE" />
                    <Text style={styles.reportarTexto}>Reportar informações deste perfil</Text>
                </Pressable>
            </ScrollView>

            <View style={[styles.rodapeFixo, { backgroundColor: cores.fundo, borderTopColor: cores.borda }]}>
                <Pressable onPress={agendarAqui} disabled={!barbearia.aceitaAgendamentoOnline || selecionando}
                    style={[styles.agendar, (!barbearia.aceitaAgendamentoOnline || selecionando) && styles.agendarDesabilitado]}>
                    {selecionando ? <ActivityIndicator color="#081426" /> : <Text style={styles.agendarTexto}>{estaSelecionada ? 'Continuar agendamento' : 'Agendar neste estabelecimento'}</Text>}
                </Pressable>
                {!barbearia.aceitaAgendamentoOnline ? <Text style={styles.indisponivel}>Agendamento online indisponível.</Text> : null}
            </View>
            <DenunciaPerfil slug={barbearia.slug} nomeBarbearia={barbearia.nome} aberto={denunciaAberta} fechar={() => setDenunciaAberta(false)} />
        </SafeAreaView>
    )
}

function Info({ icone, texto }: { icone: ComponentProps<typeof Ionicons>['name']; texto: string }) {
    const { cores } = useTema()
    return <View style={styles.info}><Ionicons name={icone} size={18} color={cores.destaque} /><Text style={[styles.infoTexto, { color: cores.textoSecundario }]}>{texto}</Text></View>
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
    const { cores } = useTema()
    return <View style={styles.secao}><Text style={[styles.secaoTitulo, { color: cores.texto }]}>{titulo}</Text><View style={styles.secaoConteudo}>{children}</View></View>
}

function moeda(valor: number) {
    return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' },
    telaEstado: { flex: 1, justifyContent: 'center', backgroundColor: '#081426' },
    conteudo: { paddingBottom: 120 },
    hero: { minHeight: 330 },
    heroImagem: { opacity: 0.92 },
    heroOverlay: { minHeight: 330, justifyContent: 'space-between', padding: 20, backgroundColor: 'rgba(4,10,19,.58)' },
    status: { alignSelf: 'flex-start', backgroundColor: '#344054', color: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, fontSize: 11, fontWeight: '900' },
    statusAberta: { backgroundColor: '#178558' },
    nome: { color: '#FFFFFF', fontSize: 34, lineHeight: 39, fontWeight: '900' },
    descricao: { color: '#DFE5ED', fontSize: 15, lineHeight: 22, marginTop: 9 },
    informacoes: { padding: 18, gap: 11, borderBottomWidth: 1, borderBottomColor: '#233147' },
    info: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    infoTexto: { flex: 1, color: '#D5DCE7', lineHeight: 20 },
    selecionada: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#12352E', padding: 11, borderRadius: 10 },
    selecionadaTexto: { color: '#C6F5DF', fontWeight: '800' },
    secao: { paddingHorizontal: 18, paddingTop: 26 },
    secaoTitulo: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', marginBottom: 13 },
    secaoConteudo: { gap: 10 },
    itemCard: { backgroundColor: '#101E33', borderWidth: 1, borderColor: '#26364E', borderRadius: 13, padding: 14 },
    itemCabecalho: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    itemTitulo: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    itemDescricao: { color: '#AEBBCE', fontSize: 13, lineHeight: 19, marginTop: 7 },
    itemMeta: { color: '#D5DCE7', fontSize: 12, marginTop: 9 },
    preco: { color: '#E7B84B', fontWeight: '900' },
    horarioLinha: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#344054' },
    horarioDia: { color: '#AEBBCE' },
    horarioValor: { color: '#FFFFFF', fontWeight: '700' },
    avaliacaoNota: { color: '#E7B84B', letterSpacing: 2 },
    reportar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 22, padding: 14 },
    reportarTexto: { color: '#AEBBCE', fontSize: 13, fontWeight: '700' },
    rodapeFixo: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#081426', borderTopWidth: 1, borderTopColor: '#26364E', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12 },
    agendar: { minHeight: 52, backgroundColor: '#E7B84B', borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    agendarTexto: { color: '#081426', fontSize: 16, fontWeight: '900' },
    agendarDesabilitado: { opacity: 0.55 },
    indisponivel: { color: '#FCA5A5', fontSize: 11, textAlign: 'center', marginTop: 5 },
})
