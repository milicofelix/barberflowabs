import EstadoErro from '@/src/components/shared/EstadoErro'
import useTema from '@/src/data/contexts/ContextoTema'
import useAPI, { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useContatosDispositivo from '@/src/data/hooks/useContatosDispositivo'
import type { ContatoDispositivo } from '@/src/data/contatos/contatosDispositivo'
import { useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native'

type Resultado = 'NOVO' | 'JA_VINCULADO' | 'POSSIVEL_DUPLICADO' | 'INVALIDO' | 'CONFLITO' | 'IMPORTADO'
interface ItemPrevia { referencia: string; resultado: Resultado; motivo?: string | null }
interface RespostaLote {
    loteId: string; status: string
    totais: { recebidos: number; novos: number; existentes: number; invalidos: number; conflitos: number; importados: number }
    itens: ItemPrevia[]
}
interface EscolhaContato { telefone?: string; email?: string }
interface ContatoEnvio { referencia: string; nome: string; telefone?: string; email?: string }

export default function ImportadorContatos({ aoConcluir, compacto = false }: { aoConcluir?: () => void | Promise<void>; compacto?: boolean }) {
    const { cores } = useTema()
    const { httpPost } = useAPI()
    const dispositivo = useContatosDispositivo()
    const [visivel, setVisivel] = useState(false)
    const [busca, setBusca] = useState('')
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
    const [escolhas, setEscolhas] = useState<Record<string, EscolhaContato>>({})
    const [previa, setPrevia] = useState<RespostaLote | null>(null)
    const [payload, setPayload] = useState<ContatoEnvio[]>([])
    const [processando, setProcessando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    const elegiveis = useMemo(() => dispositivo.contatos.filter((item) => item.nome && (item.telefones.length || item.emails.length)), [dispositivo.contatos])
    const visiveis = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase('pt-BR')
        if (!termo) return elegiveis
        return elegiveis.filter((item) => [item.nome, ...item.telefones.map((telefone) => telefone.numero), ...item.emails.map((email) => email.email)]
            .some((valor) => valor.toLocaleLowerCase('pt-BR').includes(termo)))
    }, [busca, elegiveis])

    async function abrir() {
        setVisivel(true); setErro(null); setPrevia(null)
        const permissao = await dispositivo.atualizarPermissao().catch(() => null)
        if (permissao && ['CONCEDIDA', 'LIMITADA'].includes(permissao.estado) && !dispositivo.contatos.length) await dispositivo.carregar(true)
    }
    async function permitir() {
        const permissao = await dispositivo.solicitar()
        if (permissao && ['CONCEDIDA', 'LIMITADA'].includes(permissao.estado)) await dispositivo.carregar(true)
    }
    function escolhaDe(contato: ContatoDispositivo) {
        return escolhas[contato.referencia] ?? { telefone: contato.telefones[0]?.numero, email: contato.emails[0]?.email }
    }
    function alternar(contato: ContatoDispositivo) {
        setPrevia(null)
        setEscolhas((atuais) => ({
            ...atuais,
            [contato.referencia]: atuais[contato.referencia] ?? { telefone: contato.telefones[0]?.numero, email: contato.emails[0]?.email },
        }))
        setSelecionados((atuais) => {
            const proximos = new Set(atuais)
            proximos.has(contato.referencia) ? proximos.delete(contato.referencia) : proximos.size < 200 && proximos.add(contato.referencia)
            return proximos
        })
    }
    function selecionarVisiveis() {
        setPrevia(null)
        setSelecionados((atuais) => {
            const todosMarcados = visiveis.length > 0 && visiveis.every((item) => atuais.has(item.referencia))
            const proximos = new Set(atuais)
            visiveis.forEach((item) => todosMarcados ? proximos.delete(item.referencia) : proximos.size < 200 && proximos.add(item.referencia))
            return proximos
        })
        setEscolhas((atuais) => Object.fromEntries(elegiveis.map((item) => [item.referencia, atuais[item.referencia] ?? {
            telefone: item.telefones[0]?.numero, email: item.emails[0]?.email,
        }])))
    }
    function escolher(referencia: string, campo: keyof EscolhaContato, valor: string) {
        setPrevia(null)
        setEscolhas((atuais) => ({ ...atuais, [referencia]: { ...atuais[referencia], [campo]: valor } }))
    }
    function prepararPayload() {
        const vistos = new Set<string>()
        const itens: ContatoEnvio[] = []
        elegiveis.filter((item) => selecionados.has(item.referencia)).forEach((item) => {
            const escolha = escolhaDe(item)
            const telefone = normalizarTelefone(escolha.telefone)
            const email = escolha.email?.trim().toLowerCase()
            const chaves = [telefone && `t:${telefone}`, email && `e:${email}`].filter(Boolean) as string[]
            if (!chaves.length || chaves.some((chave) => vistos.has(chave))) return
            chaves.forEach((chave) => vistos.add(chave))
            itens.push({ referencia: item.referencia, nome: item.nome, telefone: telefone || undefined, email: email || undefined })
        })
        return itens
    }
    async function simular() {
        const contatos = prepararPayload()
        if (!contatos.length) { setErro('Selecione ao menos um contato válido.'); return }
        try {
            setProcessando(true); setErro(null)
            const resposta = await httpPost<RespostaLote>('/gestao/clientes/importacoes/simular', {
                chaveIdempotencia: `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`, contatos,
            })
            setPayload(contatos); setPrevia(resposta)
        } catch (error) { setErro(mensagemDoErro(error)) }
        finally { setProcessando(false) }
    }
    async function confirmar() {
        if (!previa || processando) return
        try {
            setProcessando(true); setErro(null)
            const resposta = await httpPost<RespostaLote>(`/gestao/clientes/importacoes/${previa.loteId}/confirmar`, {
                contatos: payload, confirmarCorrespondencias: true,
            })
            setPrevia(resposta)
            await aoConcluir?.()
        } catch (error) { setErro(mensagemDoErro(error)) }
        finally { setProcessando(false) }
    }

    const concedida = ['CONCEDIDA', 'LIMITADA'].includes(dispositivo.estado)
    return <>
        <Pressable accessibilityRole="button" onPress={abrir} style={[styles.abrir, compacto && styles.abrirCompacto, { borderColor: cores.destaque }]}>
            <Text style={[styles.abrirTexto, { color: cores.destaque }]}>⇩ Importar do celular</Text>
        </Pressable>
        <Modal visible={visivel} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setVisivel(false)}>
            <SafeAreaView style={[styles.modal, { backgroundColor: cores.fundo }]}>
                <View style={styles.cabecalho}><View style={styles.cabecalhoTexto}><Text style={[styles.titulo, { color: cores.texto }]}>Importar clientes</Text>
                    <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>Somente os contatos escolhidos serão enviados. Importar não autoriza mensagens ou campanhas.</Text></View>
                    <Pressable onPress={() => setVisivel(false)} style={[styles.fechar, { borderColor: cores.borda }]}><Text style={{ color: cores.texto, fontSize: 22 }}>×</Text></Pressable></View>

                {!concedida ? <View style={[styles.permissao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
                    <Text style={[styles.subtitulo, { color: cores.texto }]}>Acesso aos contatos</Text><Text style={[styles.ajuda, { color: cores.textoSecundario }]}>{dispositivo.mensagemPermissao}</Text>
                    {dispositivo.estado === 'BLOQUEADA' ? <Pressable onPress={dispositivo.abrirConfiguracoes} style={[styles.primario, { backgroundColor: cores.destaque }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>Abrir configurações</Text></Pressable>
                        : dispositivo.estado === 'INDISPONIVEL' ? <Text style={[styles.aviso, { color: cores.textoSecundario }]}>Este recurso está disponível no aplicativo para iOS e Android. Use o cadastro manual neste dispositivo.</Text>
                            : <Pressable onPress={permitir} style={[styles.primario, { backgroundColor: cores.destaque }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>Escolher contatos permitidos</Text></Pressable>}
                    <Pressable onPress={() => setVisivel(false)}><Text style={[styles.link, { color: cores.destaque }]}>Continuar com cadastro manual</Text></Pressable>
                </View> : previa ? <View style={styles.flex}>
                    <View style={[styles.resumo, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.subtitulo, { color: cores.texto }]}>{previa.status === 'CONFIRMADO' ? 'Importação concluída' : 'Revise antes de importar'}</Text>
                        <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>Novos: {previa.totais.novos} · existentes: {previa.totais.existentes} · inválidos: {previa.totais.invalidos} · conflitos: {previa.totais.conflitos}</Text>
                        {previa.status === 'CONFIRMADO' ? <Text style={[styles.sucesso, { color: cores.sucesso }]}>{previa.totais.importados} cliente(s) importado(s) ou vinculado(s).</Text>
                            : <><Text style={[styles.aviso, { color: cores.textoSecundario }]}>Correspondências existentes serão vinculadas a este estabelecimento. Itens inválidos e conflitos serão ignorados.</Text>
                                <Pressable disabled={processando} onPress={confirmar} style={[styles.primario, { backgroundColor: cores.destaque }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{processando ? 'Importando...' : 'Confirmar importação'}</Text></Pressable></>}
                        <Pressable onPress={() => setPrevia(null)}><Text style={[styles.link, { color: cores.destaque }]}>{previa.status === 'CONFIRMADO' ? 'Importar mais contatos' : 'Voltar e revisar seleção'}</Text></Pressable></View>
                    <FlatList data={previa.itens} keyExtractor={(item) => item.referencia} contentContainerStyle={styles.lista} renderItem={({ item }) => <View style={[styles.itemPrevia, { borderColor: cores.borda }]}>
                        <Text style={[styles.nome, { color: cores.texto }]}>{payload.find((contato) => contato.referencia === item.referencia)?.nome ?? 'Contato'}</Text>
                        <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>{rotuloResultado(item.resultado)}</Text>
                        {item.motivo ? <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>{item.motivo}</Text> : null}</View>} />
                </View> : <View style={styles.flex}>
                    <View style={styles.buscaLinha}><TextInput value={busca} onChangeText={setBusca} placeholder="Buscar nome, telefone ou e-mail" placeholderTextColor={cores.textoSecundario} style={[styles.busca, { color: cores.campoTexto, backgroundColor: cores.campo, borderColor: cores.borda }]} />
                        <Pressable onPress={selecionarVisiveis} style={[styles.selecionar, { borderColor: cores.borda }]}><Text style={{ color: cores.texto, fontWeight: '800', fontSize: 11 }}>Selecionar visíveis</Text></Pressable></View>
                    <Text style={[styles.contagem, { color: cores.textoSecundario }]}>{selecionados.size}/200 selecionados · {elegiveis.length} elegíveis de {dispositivo.totalDisponivel}</Text>
                    {(erro || dispositivo.erro) ? <EstadoErro mensagem={erro ?? dispositivo.erro!} tentarNovamente={() => dispositivo.carregar(true)} /> : null}
                    <FlatList data={visiveis} keyExtractor={(item) => item.referencia} contentContainerStyle={styles.lista} onEndReached={() => dispositivo.proximoOffset !== null && dispositivo.carregar()} onEndReachedThreshold={0.4}
                        renderItem={({ item }) => { const escolha = escolhaDe(item); const marcado = selecionados.has(item.referencia); return <View style={[styles.contato, { backgroundColor: cores.superficie, borderColor: marcado ? cores.destaque : cores.borda }]}>
                            <Pressable onPress={() => alternar(item)} style={styles.contatoTopo}><View style={[styles.check, { borderColor: marcado ? cores.destaque : cores.borda, backgroundColor: marcado ? cores.destaque : 'transparent' }]}><Text style={{ color: cores.destaqueTexto }}>{marcado ? '✓' : ''}</Text></View><Text style={[styles.nome, { color: cores.texto }]}>{item.nome}</Text></Pressable>
                            {marcado && item.telefones.length > 1 ? <View style={styles.chips}>{item.telefones.map((telefone) => <Chip key={telefone.numero} texto={telefone.numero} ativo={escolha.telefone === telefone.numero} onPress={() => escolher(item.referencia, 'telefone', telefone.numero)} />)}</View> : marcado && item.telefones[0] ? <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>{item.telefones[0].numero}</Text> : null}
                            {marcado && item.emails.length > 1 ? <View style={styles.chips}>{item.emails.map((email) => <Chip key={email.email} texto={email.email} ativo={escolha.email === email.email} onPress={() => escolher(item.referencia, 'email', email.email)} />)}</View> : marcado && item.emails[0] ? <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>{item.emails[0].email}</Text> : null}
                        </View> }} ListEmptyComponent={<Text style={[styles.vazio, { color: cores.textoSecundario }]}>Nenhum contato elegível encontrado.</Text>} />
                    <Pressable disabled={!selecionados.size || processando} onPress={simular} style={[styles.primario, { backgroundColor: selecionados.size ? cores.destaque : cores.borda }]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{processando ? 'Analisando...' : `Revisar ${selecionados.size} contato(s)`}</Text></Pressable>
                </View>}
            </SafeAreaView>
        </Modal>
    </>
}

function Chip({ texto, ativo, onPress }: { texto: string; ativo: boolean; onPress: () => void }) {
    const { cores } = useTema()
    return <Pressable onPress={onPress} style={[styles.chip, { borderColor: ativo ? cores.destaque : cores.borda, backgroundColor: ativo ? cores.superficieElevada : 'transparent' }]}><Text numberOfLines={1} style={{ color: ativo ? cores.destaque : cores.texto, fontSize: 10 }}>{texto}</Text></Pressable>
}
function normalizarTelefone(valor?: string) {
    let digitos = String(valor ?? '').replace(/\D/g, '')
    if (digitos.startsWith('00')) digitos = digitos.slice(2)
    if (digitos.length === 10 || digitos.length === 11) digitos = `55${digitos}`
    return digitos.length >= 10 && digitos.length <= 15 ? `+${digitos}` : ''
}
function rotuloResultado(resultado: Resultado) { return ({ NOVO: 'Novo cliente', JA_VINCULADO: 'Já pertence ao estabelecimento', POSSIVEL_DUPLICADO: 'Conta existente encontrada', INVALIDO: 'Contato inválido', CONFLITO: 'Requer correção', IMPORTADO: 'Importado' } as Record<Resultado, string>)[resultado] }

const styles = StyleSheet.create({
    abrir: { minHeight: 42, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, abrirCompacto: { minHeight: 38 }, abrirTexto: { fontSize: 12, fontWeight: '900' },
    modal: { flex: 1, padding: 16 }, flex: { flex: 1 }, cabecalho: { flexDirection: 'row', gap: 12, marginBottom: 14 }, cabecalhoTexto: { flex: 1 }, titulo: { fontSize: 25, fontWeight: '900' }, subtitulo: { fontSize: 18, fontWeight: '900' }, ajuda: { fontSize: 12, lineHeight: 18 }, fechar: { width: 42, height: 42, borderWidth: 1, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
    permissao: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 }, primario: { minHeight: 48, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, link: { textAlign: 'center', fontWeight: '800', padding: 8 }, aviso: { fontSize: 12, lineHeight: 18 }, sucesso: { fontWeight: '900', marginTop: 5 },
    buscaLinha: { flexDirection: 'row', gap: 8 }, busca: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11 }, selecionar: { maxWidth: 105, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, contagem: { fontSize: 11, marginVertical: 8 }, lista: { gap: 8, paddingBottom: 14 },
    contato: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 7 }, contatoTopo: { flexDirection: 'row', alignItems: 'center', gap: 10 }, check: { width: 24, height: 24, borderWidth: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, nome: { fontWeight: '900', flex: 1 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, chip: { maxWidth: '100%', borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 7 }, vazio: { textAlign: 'center', padding: 24 },
    resumo: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 10, marginBottom: 10 }, itemPrevia: { borderWidth: 1, borderRadius: 10, padding: 11 },
})
