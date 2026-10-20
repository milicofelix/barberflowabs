import { useState } from 'react'
import { Modal, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { acoesRegistroRelacionamento, camposProgramaRelacionamento, canaisRelacionamento, formularioClienteRelacionamento, formularioPreferenciaRelacionamento, formulariosRelacionamento, linhasRelacionamento, registrosRelacionamento, secoesRelacionamento, tituloRegistroRelacionamento, type DadosRelacionamento, type FormularioRelacionamento } from '@uniflowabs/core'
import useCentralRelacionamento from '@/src/data/hooks/useCentralRelacionamento'
import useTema from '@/src/data/contexts/ContextoTema'
import FormularioCentral, { BotaoCentral, type EdicaoRelacionamento } from './FormularioCentral'
import { formulariosBeneficioRelacionamento, formularioSupressaoRelacionamento, limitePaginaRelacionamento } from '@uniflowabs/core'
import useSessao from '@/src/data/hooks/useSessao'

export default function CentralRelacionamento() {
    const { usuario } = useSessao()
    return <ConteudoCentral key={`${usuario?.id}:${usuario?.estabelecimentoId}`} />
}
function ConteudoCentral() {
    const dados = useCentralRelacionamento(); const { store } = dados; const { cores } = useTema()
    const [busca, setBusca] = useState(''); const [edicao, setEdicao] = useState<EdicaoRelacionamento | null>(null)
    const [inicio, setInicio] = useState(dados.inicio.slice(0, 10)); const [fim, setFim] = useState(dados.fim.slice(0, 10))
    const [erroPeriodo, setErroPeriodo] = useState('')
    const ler = dados.permissoes.includes('RELACIONAMENTO_VISUALIZAR'); const gerenciar = dados.permissoes.includes('RELACIONAMENTO_GERENCIAR')
    const atual = dados.selecionado
    const formularios = formulariosRelacionamento(dados.secao, dados.clientes, dados.templates).filter(f => dados.secao !== 'fidelidade' || f.caminho.endsWith(`/${dados.grupoFidelidade}`))
    function editar(form: FormularioRelacionamento, registro?: DadosRelacionamento, canal?: string) { setEdicao({ form, registro, canal }) }
    const texto = { color: cores.texto }; const entrada = { minHeight: 48, padding: 12, borderWidth: 1, borderColor: cores.borda, borderRadius: 10, color: cores.campoTexto, backgroundColor: cores.campo }
    const cartao = { padding: 14, gap: 10, borderRadius: 12, borderWidth: 1, borderColor: cores.borda, backgroundColor: cores.superficie }
    return <View style={{ gap: 14 }}>
        <Text accessibilityRole="header" style={[texto, { fontSize: 23, fontWeight: '800' }]}>Central de relacionamento</Text>
        <Text style={{ color: cores.textoSecundario }}>Clientes, comunicação e fidelização da unidade. Contatos importados não autorizam campanhas automaticamente.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{secoesRelacionamento.filter(s => s.id !== 'metricas' || dados.permissoes.includes('FINANCEIRO_VISUALIZAR')).map(s => <BotaoCentral key={s.id} texto={`${dados.secao === s.id ? '✓ ' : ''}${s.titulo}`} desabilitado={!ler || dados.salvando} acao={() => { setEdicao(null); void store.carregar({ secao: s.id, pagina: 1 }) }} />)}</View>
        {dados.erro || erroPeriodo ? <Text accessibilityRole="alert" style={texto}>{dados.erro || erroPeriodo}</Text> : null}
        {dados.mensagem ? <Text accessibilityRole="alert" style={texto}>{dados.mensagem}</Text> : null}
        {ler ? <>
            <BotaoCentral texto={dados.carregando ? 'Carregando…' : 'Atualizar'} desabilitado={dados.carregando || dados.salvando} acao={() => void store.recarregar()} />
            {dados.secao === 'fidelidade' ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(['recompensas', 'cupons', 'indicacoes'] as const).map(grupo => <BotaoCentral key={grupo} texto={`${dados.grupoFidelidade === grupo ? '✓ ' : ''}${grupo === 'indicacoes' ? 'Indicações' : grupo === 'cupons' ? 'Cupons' : 'Recompensas'}`} acao={() => void store.carregar({ grupoFidelidade: grupo, pagina: 1 })} />)}</View> : null}
            {gerenciar ? formularios.map(form => <BotaoCentral key={form.titulo} texto={form.titulo} desabilitado={dados.salvando} acao={() => editar(form)} />) : null}
            {dados.secao === 'fidelidade' && dados.permissoes.includes('AGENDA_GERENCIAR') ? formulariosBeneficioRelacionamento().filter(f => gerenciar || f.metodo === 'GET').map(form => <BotaoCentral key={form.titulo} texto={form.titulo} acao={() => editar(form)} />) : null}
            {dados.secao === 'clientes' ? <><TextInput accessibilityLabel="Pesquisar cliente por nome, e-mail ou telefone" value={busca} onChangeText={setBusca} placeholder="Nome, e-mail ou telefone" placeholderTextColor={cores.textoSecundario} style={entrada} onSubmitEditing={() => void store.carregar({ busca, pagina: 1 })} /><BotaoCentral texto="Pesquisar" acao={() => void store.carregar({ busca, pagina: 1 })} /></> : null}
            {dados.secao === 'metricas' ? <View style={{ gap: 8 }}><Text style={texto}>Período de até 93 dias, datas locais deste dispositivo.</Text><TextInput accessibilityLabel="Início do período" style={entrada} value={inicio} onChangeText={setInicio} placeholder="Início: AAAA-MM-DD" placeholderTextColor={cores.textoSecundario} /><TextInput accessibilityLabel="Fim exclusivo do período" style={entrada} value={fim} onChangeText={setFim} placeholder="Fim exclusivo: AAAA-MM-DD" placeholderTextColor={cores.textoSecundario} /><BotaoCentral texto="Consultar período" acao={() => { try { setErroPeriodo(''); const a = new Date(`${inicio}T00:00:00`).toISOString(); const b = new Date(`${fim}T00:00:00`).toISOString(); void store.carregar({ inicio: a, fim: b }) } catch { setErroPeriodo('Informe as datas no formato AAAA-MM-DD.') } }} /></View> : null}
            {dados.secao === 'fidelidade' ? <View style={cartao}><Text style={texto}>Programa {dados.programa.ativo ? 'ativo' : 'inativo'} · Validade: {String(dados.programa.validadeDias ?? '—')} dias · {String(dados.programa.centavosPorPonto ?? '—')} centavos por ponto.</Text>
                {gerenciar ? <BotaoCentral texto="Configurar programa" acao={() => editar({ titulo: 'Configurar programa', caminho: '/relacionamento/fidelidade/programa', metodo: 'PUT', campos: camposProgramaRelacionamento, aviso: 'Valores em centavos. Sem pontos retroativos.', confirmar: 'Confirmo as regras e a ativação ou desativação do programa.' }, dados.programa)} /> : null}
            </View> : null}
            {dados.itens.map((item, indice) => <View key={String(item.chaveRegistro ?? item.id ?? indice)} style={cartao}><Text style={[texto, { fontWeight: '800', fontSize: 17 }]}>{tituloRegistroRelacionamento(item)}</Text><Text style={{ color: cores.textoSecundario }}>{String(item.tipoRegistro ?? item.canal ?? '')} · {String(item.status ?? (item.ativo === undefined ? '' : item.ativo ? 'Ativo' : 'Inativo'))}</Text>{dados.secao === 'metricas' ? <Leitura dados={item} /> : <BotaoCentral texto="Ver detalhes" desabilitado={dados.carregando} acao={() => void store.selecionar(item)} />}</View>)}
            {!dados.carregando && !dados.itens.length ? <Text style={texto}>Nenhum registro encontrado nesta área.</Text> : null}
            {dados.secao !== 'metricas' ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}><BotaoCentral texto="Anterior" desabilitado={dados.pagina <= 1 || dados.carregando} acao={() => void store.carregar({ pagina: dados.pagina - 1 })} /><Text style={texto}>Página {dados.pagina}</Text><BotaoCentral texto="Próxima" desabilitado={dados.carregando || dados.pagina * limitePaginaRelacionamento(dados) >= dados.total} acao={() => void store.carregar({ pagina: dados.pagina + 1 })} /></View> : null}
            {atual ? <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (!dados.salvando) void store.selecionar(null) }}><SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}><View style={{ padding: 14, gap: 8 }}><Text accessibilityRole="header" style={[texto, { fontWeight: '800', fontSize: 20 }]}>{tituloRegistroRelacionamento(atual)}</Text><BotaoCentral texto="Fechar detalhes" desabilitado={dados.salvando} acao={() => void store.selecionar(null)} /></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 14, gap: 12 }}>
                {dados.erro ? <Text accessibilityRole="alert" style={texto}>{dados.erro}</Text> : null}
                {dados.carregando ? <Text style={texto}>Carregando detalhes…</Text> : null}
                {gerenciar && dados.detalhe ? <>
                    {dados.secao === 'clientes' ? <BotaoCentral texto="Supressão de campanhas" acao={() => editar(formularioSupressaoRelacionamento(Number(atual.id)))} /> : null}
                    {dados.secao === 'campanhas' && atual.status === 'RASCUNHO' && !atual.audienciaCongeladaEm ? <BotaoCentral texto="Editar rascunho" acao={() => editar({ ...formulariosRelacionamento('campanhas', [], dados.templates)[0]!, titulo: 'Editar rascunho', metodo: 'PUT', caminho: `/relacionamento/campanhas/${atual.id}` }, atual)} /> : null}
                    {dados.secao === 'clientes' ? <><BotaoCentral texto="Editar relacionamento" acao={() => editar(formularioClienteRelacionamento(atual), atual)} />{canaisRelacionamento.map(canal => <BotaoCentral key={canal} texto={`Preferência ${canal}`} acao={() => editar(formularioPreferenciaRelacionamento(Number(atual.id), canal), registrosRelacionamento(dados.detalhe?.preferencias).find(p => p.canal === canal), canal)} />)}</> : null}
                    {acoesRegistroRelacionamento(dados.secao, atual).map(acao => <BotaoCentral key={acao.titulo} texto={acao.titulo} desabilitado={dados.salvando} acao={() => editar(acao.formulario ?? { titulo: acao.titulo, caminho: acao.caminho, metodo: 'POST', campos: [], confirmar: acao.confirmar }, atual)} />)}
                </> : null}
                {dados.detalhe ? <Leitura dados={dados.detalhe} /> : null}
                {dados.totalDetalhe > 0 ? <><Text style={texto}>Página de detalhes {dados.paginaDetalhe}</Text><BotaoCentral texto="Anterior" desabilitado={dados.carregando || dados.paginaDetalhe <= 1} acao={() => void store.selecionar(atual, dados.paginaDetalhe - 1)} /><BotaoCentral texto="Próxima" desabilitado={dados.carregando || dados.paginaDetalhe * (dados.secao === 'clientes' ? 50 : 25) >= dados.totalDetalhe} acao={() => void store.selecionar(atual, dados.paginaDetalhe + 1)} /></> : null}
            </ScrollView>
                {edicao && (gerenciar || edicao.form.metodo === 'GET') ? <FormularioCentral key={`${edicao.form.caminho}:${edicao.canal ?? ''}`} edicao={edicao} ocupado={dados.salvando} erro={dados.erro} fechar={() => setEdicao(null)} salvar={valores => store.salvar(edicao.form, valores, edicao.canal)} /> : null}
            </SafeAreaView></Modal> : null}
        </> : null}
        {!atual && edicao && (gerenciar || edicao.form.metodo === 'GET') ? <FormularioCentral key={`${edicao.form.caminho}:${edicao.canal ?? ''}`} edicao={edicao} ocupado={dados.salvando} erro={dados.erro} fechar={() => setEdicao(null)} salvar={valores => store.salvar(edicao.form, valores, edicao.canal)} /> : null}
    </View>
}
function Leitura({ dados }: { dados: DadosRelacionamento }) {
    const { cores } = useTema()
    return <View style={{ gap: 10 }}>{linhasRelacionamento(dados).map((linha, i) => <View key={`${linha.titulo}:${i}`}><Text style={{ color: cores.textoSecundario, fontSize: 12 }}>{linha.titulo}</Text><Text selectable style={{ color: cores.texto }}>{linha.valor}</Text></View>)}</View>
}
