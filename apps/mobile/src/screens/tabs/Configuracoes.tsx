import CampoTexto from '@/src/components/shared/CampoTexto'
import HorariosAgenda from '@/src/components/configuracoes/HorariosAgenda'
import Carregando from '@/src/components/shared/Carregando'
import EstadoErro from '@/src/components/shared/EstadoErro'
import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import useConfiguracoesEstabelecimento from '@/src/data/hooks/useConfiguracoesEstabelecimento'
import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useTema from '@/src/data/contexts/ContextoTema'

export default function Configuracoes() {
    const { cores } = useTema()
    const dados = useConfiguracoesEstabelecimento()
    if (dados.carregando) return <Carregando mensagem="Carregando configurações..." />
    if (!dados.perfil || !dados.agenda) return <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]}><EstadoErro mensagem={dados.erro ?? 'Configuração indisponível'} tentarNovamente={dados.carregar} /></SafeAreaView>
    const atualizarPerfil = (campo: string, valor: any) => dados.setPerfil((atual) => atual ? { ...atual, [campo]: valor } : atual)
    return <SafeAreaView style={[styles.safeArea, { backgroundColor: cores.fundo }]} edges={['top']}><ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.sobretitulo}>CONFIGURAÇÕES</Text><Text style={[styles.titulo, { color: cores.texto }]}>Seu estabelecimento</Text>
        <Secao titulo="Identidade pública">
            <CampoTexto label="Nome público" value={dados.perfil.nomePublico ?? ''} onChangeText={(v) => atualizarPerfil('nomePublico', v)} />
            <CampoTexto label="Descrição" value={dados.perfil.descricaoPublica ?? ''} onChangeText={(v) => atualizarPerfil('descricaoPublica', v)} multiline />
            <CampoTexto label="Telefone" value={dados.perfil.telefone ?? ''} onChangeText={(v) => atualizarPerfil('telefone', v)} keyboardType="phone-pad" />
            <CampoTexto label="E-mail" value={dados.perfil.email ?? ''} onChangeText={(v) => atualizarPerfil('email', v)} keyboardType="email-address" />
        </Secao>
        <Secao titulo="Localização">
            <CampoTexto label="Endereço" value={dados.perfil.endereco ?? ''} onChangeText={(v) => atualizarPerfil('endereco', v)} />
            <CampoTexto label="Bairro" value={dados.perfil.bairro ?? ''} onChangeText={(v) => atualizarPerfil('bairro', v)} />
            <CampoTexto label="Cidade" value={dados.perfil.cidade ?? ''} onChangeText={(v) => atualizarPerfil('cidade', v)} />
            <CampoTexto label="Estado" value={dados.perfil.estado ?? ''} onChangeText={(v) => atualizarPerfil('estado', v)} maxLength={2} autoCapitalize="characters" />
        </Secao>
        <Secao titulo="Agenda">
            <View style={styles.linha}><Text style={styles.label}>Aceitar agendamento online</Text><Switch value={dados.perfil.aceitaAgendamentoOnline} onValueChange={(v) => atualizarPerfil('aceitaAgendamentoOnline', v)} /></View>
            <CampoTexto label="Antecedência mínima em minutos" value={String(dados.agenda.antecedenciaMinutos)} keyboardType="number-pad"
                onChangeText={(v) => dados.setAgenda((atual) => atual ? { ...atual, antecedenciaMinutos: Number(v.replace(/\D/g, '')) || 0 } : atual)} />
            <HorariosAgenda horarios={dados.agenda.horarios} alterar={(horarios) => dados.setAgenda((atual) => atual ? { ...atual, horarios } : atual)} />
        </Secao>
        <Secao titulo="Classificação">
            <Text style={styles.valor}>{dados.catalogo?.tipoEstabelecimento ?? 'Não definida'} · {dados.catalogo?.modeloAtendimento ?? 'Não definido'}</Text>
            <Text style={styles.ajuda}>Segmentos: {dados.catalogo?.segmentos?.map((item: any) => item.segmento?.nome).join(', ') || 'nenhum'}</Text>
            <Text style={styles.ajuda}>Especialidades: {dados.catalogo?.especialidades?.map((item: any) => item.especialidade?.nome).join(', ') || 'nenhuma'}</Text>
        </Secao>
        {dados.erro ? <EstadoErro mensagem={dados.erro} /> : null}{dados.sucesso ? <FeedbackSucesso mensagem={dados.sucesso} /> : null}
        <Pressable style={styles.botao} onPress={dados.salvar} disabled={dados.salvando}><Text style={styles.botaoTexto}>{dados.salvando ? 'Salvando...' : 'Salvar configurações'}</Text></Pressable>
    </ScrollView></SafeAreaView>
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
    const { cores } = useTema()
    return <View style={[styles.secao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.secaoTitulo, { color: cores.texto }]}>{titulo}</Text>{children}</View>
}
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#081426' }, conteudo: { padding: 18, paddingBottom: 42, gap: 14 }, sobretitulo: { color: '#E7B84B', fontSize: 12, fontWeight: '800', letterSpacing: 1.2 }, titulo: { color: '#FFF', fontSize: 29, fontWeight: '900' },
    secao: { backgroundColor: '#101E33', borderRadius: 14, borderWidth: 1, borderColor: '#26364E', padding: 15, gap: 8 }, secaoTitulo: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 5 },
    linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, label: { flex: 1, color: '#D5DCE7', fontWeight: '700' }, ajuda: { color: '#AEBBCE', lineHeight: 19 }, valor: { color: '#E7B84B', fontWeight: '800' },
    botao: { minHeight: 52, borderRadius: 13, backgroundColor: '#E7B84B', justifyContent: 'center', alignItems: 'center' }, botaoTexto: { color: '#081426', fontWeight: '900' },
})
