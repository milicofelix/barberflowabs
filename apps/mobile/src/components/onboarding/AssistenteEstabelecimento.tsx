import { MaterialIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import useTema from '@/src/data/contexts/ContextoTema'
import useSessao from '@/src/data/hooks/useSessao'
import useOnboardingEstabelecimento from '@/src/data/hooks/useOnboardingEstabelecimento'
import { consultarViaCep } from '@/src/data/onboarding/viacep'
import {
    formatarCep, formatarTelefone, MODELOS_ATENDIMENTO, somenteDigitos, TIPOS_ESTABELECIMENTO,
} from '@/src/data/onboarding/solicitacao-estabelecimento'
import CampoTexto from '../shared/CampoTexto'
import Carregando from '../shared/Carregando'
import EstadoErro from '../shared/EstadoErro'

const PASSOS = ['Responsável', 'Tipo', 'Negócio', 'Endereço', 'Revisão']
const STATUS_EDITAVEIS = ['RASCUNHO', 'REJECTED', 'CORRECTION_REQUESTED']

export default function AssistenteEstabelecimento() {
    const { cores } = useTema()
    const { usuario } = useSessao()
    const fluxo = useOnboardingEstabelecimento()
    const [aceitouTermos, setAceitouTermos] = useState(false)
    const [consultandoCep, setConsultandoCep] = useState(false)
    const [erroCep, setErroCep] = useState<string | null>(null)

    if (fluxo.carregando) return <Carregando mensagem="Preparando seu cadastro..." />
    if (!fluxo.solicitacao) return <View style={styles.estado}><EstadoErro mensagem={fluxo.erro ?? 'Não foi possível iniciar o cadastro.'} /></View>
    if (!STATUS_EDITAVEIS.includes(fluxo.solicitacao.status)) return <Acompanhamento solicitacao={fluxo.solicitacao} />

    async function buscarCep() {
        if (fluxo.form.modeloAtendimento === 'DOMICILIAR') return
        try {
            setConsultandoCep(true); setErroCep(null)
            const endereco = await consultarViaCep(fluxo.form.cep)
            fluxo.alterar('cep', formatarCep(endereco.cep)); fluxo.alterar('logradouro', endereco.logradouro)
            fluxo.alterar('bairro', endereco.bairro); fluxo.alterar('cidade', endereco.localidade)
            fluxo.alterar('estado', endereco.uf); fluxo.alterar('complemento', fluxo.form.complemento || endereco.complemento)
        } catch (erro) { setErroCep(erro instanceof Error ? erro.message : 'Não foi possível consultar o CEP.') }
        finally { setConsultandoCep(false) }
    }

    return <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Progresso passo={fluxo.passo} />
        <View style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            {fluxo.passo === 0 && <View style={styles.secao}>
                <Titulo titulo="Conta do responsável" descricao="Usaremos sua conta atual. Você não precisa criar outro cadastro." />
                <View style={[styles.responsavel, { backgroundColor: cores.superficieElevada, borderColor: cores.borda }]}>
                    <Text style={[styles.responsavelNome, { color: cores.texto }]}>{usuario?.nome}</Text>
                    <Text style={[styles.texto, { color: cores.textoSecundario }]}>{usuario?.email}</Text>
                    {usuario?.telefone ? <Text style={[styles.texto, { color: cores.textoSecundario }]}>{formatarTelefone(usuario.telefone)}</Text> : null}
                </View>
                <Text style={[styles.observacao, { color: cores.textoSecundario }]}>✓ Você continuará como cliente enquanto a solicitação estiver em análise.</Text>
            </View>}

            {fluxo.passo === 1 && <View style={styles.secao}>
                <Titulo titulo="Qual é o seu tipo de negócio?" descricao="Escolha a opção mais próxima. Sugeriremos classificações compatíveis." />
                <View style={styles.gradeTipos}>{TIPOS_ESTABELECIMENTO.map((tipo) => {
                    const ativo = fluxo.form.tipoEstabelecimento === tipo.valor
                    return <Pressable key={tipo.valor} onPress={() => fluxo.selecionarTipo(tipo.valor)} style={[styles.tipo,
                        { borderColor: ativo ? '#8B5CF6' : cores.borda, backgroundColor: ativo ? '#6D28D9' : cores.superficieElevada }]}>
                        <MaterialIcons name={tipo.icone as any} size={25} color={ativo ? '#FFFFFF' : cores.destaque} />
                        <Text style={[styles.tipoTitulo, { color: ativo ? '#FFFFFF' : cores.texto }]}>{tipo.texto}</Text>
                        <Text style={[styles.tipoDescricao, { color: ativo ? '#EDE9FE' : cores.textoSecundario }]}>{tipo.descricao}</Text>
                    </Pressable>
                })}</View>
                <GrupoOpcoes titulo="Segmentos oferecidos" itens={fluxo.segmentos} selecionados={fluxo.form.segmentoIds} alternar={fluxo.alternarSegmento} />
                <GrupoOpcoes titulo="Especialidades" itens={fluxo.especialidades} selecionados={fluxo.form.especialidadeIds} alternar={fluxo.alternarEspecialidade} />
            </View>}

            {fluxo.passo === 2 && <View style={styles.secao}>
                <Titulo titulo="Identificação comercial" descricao="O endereço da página será criado automaticamente após a aprovação." />
                <CampoTexto label="Nome público *" value={fluxo.form.nomePublico} onChangeText={(valor) => fluxo.alterar('nomePublico', valor)} />
                <CampoTexto label="E-mail comercial *" value={fluxo.form.emailComercial} onChangeText={(valor) => fluxo.alterar('emailComercial', valor.trim().toLowerCase())} keyboardType="email-address" autoCapitalize="none" />
                <CampoTexto label="Telefone comercial *" value={formatarTelefone(fluxo.form.telefoneComercial)} onChangeText={(valor) => fluxo.alterar('telefoneComercial', formatarTelefone(valor))} keyboardType="phone-pad" maxLength={15} />
                <GrupoTexto titulo="Modelo de atendimento" itens={MODELOS_ATENDIMENTO} selecionado={fluxo.form.modeloAtendimento} alterar={(valor) => fluxo.alterar('modeloAtendimento', valor)} />
                <GrupoTexto titulo="Plano desejado" itens={fluxo.planos.map((plano) => [plano.slug, plano.nome])} selecionado={fluxo.form.planoSlug} alterar={(valor) => fluxo.alterar('planoSlug', valor)} />
            </View>}

            {fluxo.passo === 3 && <View style={styles.secao}>
                <Titulo titulo="Endereço do atendimento" descricao={fluxo.form.modeloAtendimento === 'DOMICILIAR' ? 'Para atendimento domiciliar, o endereço comercial é opcional.' : 'Busque pelo CEP e corrija os campos se necessário.'} />
                <CampoTexto label="CEP *" value={formatarCep(fluxo.form.cep)} onChangeText={(valor) => fluxo.alterar('cep', formatarCep(valor))} keyboardType="number-pad" maxLength={9}
                    acaoDireita={<Pressable onPress={buscarCep} disabled={consultandoCep} style={styles.buscarCep}>{consultandoCep ? <ActivityIndicator size="small" color={cores.destaque} /> : <MaterialIcons name="search" size={23} color={cores.destaque} />}</Pressable>} />
                {erroCep ? <EstadoErro mensagem={erroCep} /> : null}
                <CampoTexto label="Logradouro *" value={fluxo.form.logradouro} onChangeText={(valor) => fluxo.alterar('logradouro', valor)} />
                <CampoTexto label="Número *" value={fluxo.form.numero} onChangeText={(valor) => fluxo.alterar('numero', valor)} />
                <CampoTexto label="Complemento" value={fluxo.form.complemento} onChangeText={(valor) => fluxo.alterar('complemento', valor)} />
                <CampoTexto label="Ponto de referência" value={fluxo.form.pontoReferencia} onChangeText={(valor) => fluxo.alterar('pontoReferencia', valor)} />
                <CampoTexto label="Bairro *" value={fluxo.form.bairro} onChangeText={(valor) => fluxo.alterar('bairro', valor)} />
                <CampoTexto label="Cidade *" value={fluxo.form.cidade} onChangeText={(valor) => fluxo.alterar('cidade', valor)} />
                <CampoTexto label="UF *" value={fluxo.form.estado} onChangeText={(valor) => fluxo.alterar('estado', valor.toUpperCase().replace(/[^A-Z]/g, ''))} maxLength={2} autoCapitalize="characters" />
                <Text style={[styles.observacao, { color: cores.textoSecundario }]}>A administração validará as coordenadas. Você não precisa informar latitude ou longitude.</Text>
            </View>}

            {fluxo.passo === 4 && <Revisao fluxo={fluxo} aceitou={aceitouTermos} alterarAceite={setAceitouTermos} />}
            {fluxo.erro ? <EstadoErro mensagem={fluxo.erro} /> : null}
            {fluxo.mensagem ? <Text style={[styles.feedback, { color: cores.sucesso, borderColor: cores.sucesso }]}>{fluxo.mensagem}</Text> : null}
            <View style={styles.acoes}>
                <BotaoSecundario texto="Voltar" desabilitado={fluxo.passo === 0 || fluxo.processando} acao={fluxo.voltar} />
                <BotaoPrimario texto={fluxo.processando ? 'Salvando...' : fluxo.passo === 4 ? 'Enviar para análise' : 'Continuar'} desabilitado={fluxo.processando}
                    acao={() => fluxo.passo === 4 ? fluxo.enviar(aceitouTermos) : fluxo.avancar()} />
            </View>
        </View>
    </ScrollView>
}

function Titulo({ titulo, descricao }: { titulo: string; descricao: string }) { const { cores } = useTema(); return <View><Text style={[styles.titulo, { color: cores.texto }]}>{titulo}</Text><Text style={[styles.descricao, { color: cores.textoSecundario }]}>{descricao}</Text></View> }
function Progresso({ passo }: { passo: number }) { const { cores } = useTema(); return <View style={styles.progresso}>{PASSOS.map((nome, indice) => <View key={nome} style={styles.progressoItem}><View style={[styles.numero, { borderColor: indice <= passo ? '#8B5CF6' : cores.borda, backgroundColor: indice <= passo ? '#6D28D9' : cores.superficie }]}><Text style={{ color: indice <= passo ? '#FFF' : cores.textoSecundario, fontWeight: '800' }}>{indice < passo ? '✓' : indice + 1}</Text></View><Text numberOfLines={1} style={[styles.passoNome, { color: cores.textoSecundario }]}>{nome}</Text></View>)}</View> }
function GrupoOpcoes({ titulo, itens, selecionados, alternar }: { titulo: string; itens: Array<{ id: number; nome: string }>; selecionados: number[]; alternar: (id: number) => void }) { return <View style={styles.grupo}><Rotulo texto={titulo} /><View style={styles.chips}>{itens.map((item) => <Chip key={item.id} texto={item.nome} ativo={selecionados.includes(item.id)} acao={() => alternar(item.id)} />)}</View>{!itens.length ? <Text style={styles.semOpcoes}>Selecione um segmento primeiro.</Text> : null}</View> }
function GrupoTexto({ titulo, itens, selecionado, alterar }: { titulo: string; itens: string[][]; selecionado: string; alterar: (id: string) => void }) { return <View style={styles.grupo}><Rotulo texto={titulo} /><View style={styles.chips}>{itens.map(([id, nome]) => <Chip key={id} texto={nome} ativo={selecionado === id} acao={() => alterar(id)} />)}</View></View> }
function Rotulo({ texto }: { texto: string }) { const { cores } = useTema(); return <Text style={[styles.rotulo, { color: cores.texto }]}>{texto}</Text> }
function Chip({ texto, ativo, acao }: { texto: string; ativo: boolean; acao: () => void }) { const { cores } = useTema(); return <Pressable onPress={acao} style={[styles.chip, { borderColor: ativo ? '#8B5CF6' : cores.borda, backgroundColor: ativo ? '#6D28D9' : cores.superficieElevada }]}><Text style={{ color: ativo ? '#FFF' : cores.texto, fontWeight: '700', fontSize: 13 }}>{texto}</Text></Pressable> }

function Revisao({ fluxo, aceitou, alterarAceite }: { fluxo: ReturnType<typeof useOnboardingEstabelecimento>; aceitou: boolean; alterarAceite: (valor: boolean) => void }) {
    const { cores } = useTema(); const f = fluxo.form
    const tipo = TIPOS_ESTABELECIMENTO.find((item) => item.valor === f.tipoEstabelecimento)?.texto
    return <View style={styles.secao}><Titulo titulo="Revise e envie" descricao="Confira os dados antes de encaminhar para análise." />
        <View style={[styles.resumo, { backgroundColor: cores.superficieElevada, borderColor: cores.borda }]}>
            <LinhaResumo rotulo="Tipo" valor={tipo} /><LinhaResumo rotulo="Nome público" valor={f.nomePublico} />
            <LinhaResumo rotulo="Contato" valor={`${f.emailComercial}\n${formatarTelefone(f.telefoneComercial)}`} />
            <LinhaResumo rotulo="Segmentos" valor={fluxo.segmentos.filter((item) => f.segmentoIds.includes(item.id)).map((item) => item.nome).join(', ')} />
            <LinhaResumo rotulo="Especialidades" valor={fluxo.especialidades.filter((item) => f.especialidadeIds.includes(item.id)).map((item) => item.nome).join(', ')} />
            <LinhaResumo rotulo="Endereço" valor={f.modeloAtendimento === 'DOMICILIAR' ? 'Atendimento domiciliar' : `${f.logradouro}, ${f.numero}\n${f.bairro} · ${f.cidade}/${f.estado}`} />
        </View>
        <Pressable onPress={() => alterarAceite(!aceitou)} style={[styles.termos, { borderColor: aceitou ? '#8B5CF6' : cores.borda }]}><MaterialIcons name={aceitou ? 'check-box' : 'check-box-outline-blank'} size={24} color={aceitou ? '#8B5CF6' : cores.textoSecundario} /><Text style={[styles.termosTexto, { color: cores.texto }]}>Declaro que os dados são verdadeiros e aceito os termos, versão {fluxo.configuracao?.termosVersao}.</Text></Pressable>
    </View>
}
function LinhaResumo({ rotulo, valor }: { rotulo: string; valor?: string }) { const { cores } = useTema(); return <View style={styles.linhaResumo}><Text style={[styles.resumoRotulo, { color: cores.textoSecundario }]}>{rotulo}</Text><Text style={[styles.resumoValor, { color: cores.texto }]}>{valor || 'Não informado'}</Text></View> }
function BotaoPrimario({ texto, acao, desabilitado }: { texto: string; acao: () => void; desabilitado?: boolean }) { return <Pressable onPress={acao} disabled={desabilitado} style={[styles.botao, styles.botaoPrimario, desabilitado && styles.desabilitado]}><Text style={styles.botaoPrimarioTexto}>{texto}</Text></Pressable> }
function BotaoSecundario({ texto, acao, desabilitado }: { texto: string; acao: () => void; desabilitado?: boolean }) { const { cores } = useTema(); return <Pressable onPress={acao} disabled={desabilitado} style={[styles.botao, { borderColor: cores.borda }, desabilitado && styles.desabilitado]}><Text style={{ color: cores.texto, fontWeight: '800' }}>{texto}</Text></Pressable> }
function Acompanhamento({ solicitacao }: { solicitacao: { id: number; status: string; enviadoEm?: string | null; motivoRevisao?: string | null } }) { const { cores } = useTema(); const rotulos: Record<string, string> = { PENDING_REVIEW: 'Em análise', APPROVED: 'Aprovada', CANCELED: 'Cancelada' }; return <View style={styles.estado}><View style={[styles.cartao, styles.acompanhamento, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><MaterialIcons name="verified" size={58} color={cores.sucesso} /><Text style={[styles.titulo, { color: cores.texto }]}>Solicitação {rotulos[solicitacao.status] ?? solicitacao.status}</Text><Text style={[styles.descricao, { color: cores.textoSecundario }]}>Protocolo #{solicitacao.id}{solicitacao.enviadoEm ? ` · ${new Date(solicitacao.enviadoEm).toLocaleDateString('pt-BR')}` : ''}</Text>{solicitacao.motivoRevisao ? <EstadoErro mensagem={solicitacao.motivoRevisao} /> : null}<Text style={[styles.observacao, { color: cores.textoSecundario }]}>Você será avisado quando houver uma atualização.</Text></View></View> }

const styles = StyleSheet.create({
    conteudo: { padding: 16, paddingBottom: 42, gap: 18 }, estado: { flex: 1, padding: 18, justifyContent: 'center' },
    progresso: { flexDirection: 'row', justifyContent: 'space-between', gap: 3 }, progressoItem: { flex: 1, alignItems: 'center', gap: 5 }, numero: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, passoNome: { fontSize: 10, maxWidth: 68 },
    cartao: { borderWidth: 1, borderRadius: 22, padding: 18, gap: 20 }, secao: { gap: 16 }, titulo: { fontSize: 23, fontWeight: '900' }, descricao: { fontSize: 14, lineHeight: 20, marginTop: 4 }, texto: { fontSize: 14 }, observacao: { fontSize: 13, lineHeight: 19 },
    responsavel: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 4 }, responsavelNome: { fontSize: 18, fontWeight: '800' },
    gradeTipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, tipo: { width: '48%', minHeight: 122, borderWidth: 1, borderRadius: 14, padding: 13 }, tipoTitulo: { fontWeight: '900', marginTop: 8 }, tipoDescricao: { fontSize: 11, lineHeight: 16, marginTop: 2 },
    grupo: { gap: 9 }, rotulo: { fontSize: 14, fontWeight: '800' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 }, semOpcoes: { color: '#7B8798', fontSize: 12 }, buscarCep: { paddingHorizontal: 8, paddingVertical: 6 },
    feedback: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13 }, acoes: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, botao: { minHeight: 48, minWidth: 105, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, botaoPrimario: { flex: 1, backgroundColor: '#6D28D9', borderColor: '#6D28D9' }, botaoPrimarioTexto: { color: '#FFF', fontWeight: '900' }, desabilitado: { opacity: 0.45 },
    resumo: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 14 }, linhaResumo: { gap: 3 }, resumoRotulo: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }, resumoValor: { fontSize: 14, lineHeight: 20, fontWeight: '600' }, termos: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 13, padding: 14 }, termosTexto: { flex: 1, fontSize: 13, lineHeight: 19 }, acompanhamento: { alignItems: 'center' },
})
