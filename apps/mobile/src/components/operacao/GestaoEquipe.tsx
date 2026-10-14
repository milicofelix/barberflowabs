import CampoTexto from '@/src/components/shared/CampoTexto'
import FeedbackSucesso from '@/src/components/shared/FeedbackSucesso'
import { mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import type { EscalaProfissional, MembroEquipe, PermissaoEquipe, ProfissionalOperacional, UsuarioEquipe } from '@/src/data/operacao/tipos'
import { useEffect, useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

const PERMISSOES: Array<{ id: PermissaoEquipe; nome: string }> = [
    { id: 'EQUIPE_GERENCIAR', nome: 'Equipe' }, { id: 'ESCALAS_GERENCIAR', nome: 'Escalas' },
    { id: 'RECURSOS_GERENCIAR', nome: 'Recursos' }, { id: 'AGENDA_GERENCIAR', nome: 'Agenda' },
    { id: 'FINANCEIRO_VISUALIZAR', nome: 'Visualizar financeiro' },
    { id: 'FINANCEIRO_GERENCIAR', nome: 'Gerenciar financeiro' },
    { id: 'FINANCEIRO_AUDITAR', nome: 'Auditar financeiro' },
    { id: 'RELACIONAMENTO_VISUALIZAR', nome: 'Visualizar relacionamento' },
    { id: 'RELACIONAMENTO_GERENCIAR', nome: 'Gerenciar relacionamento' },
    { id: 'CONFIGURACOES_GERENCIAR', nome: 'Configurações' },
]
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function MembrosEquipe({ membros, usuarios, profissionais, salvar, criarPerfil, remover, erro }: {
    membros: MembroEquipe[]; usuarios: UsuarioEquipe[]; profissionais: ProfissionalOperacional[]
    salvar: (dados: { usuarioId: number; profissionalId?: number | null; papel: string; permissoes: PermissaoEquipe[]; ativo?: boolean }, membroId?: number) => Promise<boolean>
    criarPerfil: (membro: MembroEquipe, sexo: 'MASCULINO' | 'FEMININO') => Promise<boolean>
    remover: (id: number) => Promise<boolean>
    erro?: string | null
}) {
    const { cores } = useTema(); const [usuarioId, setUsuarioId] = useState<number | null>(null)
    const [profissionalId, setProfissionalId] = useState<number | null>(null); const [papel, setPapel] = useState('PROFISSIONAL')
    const [permissoes, setPermissoes] = useState<PermissaoEquipe[]>(['AGENDA_GERENCIAR'])
    const [salvando, setSalvando] = useState(false)
    const [resultado, setResultado] = useState<'sucesso' | 'erro' | null>(null)
    const membroSelecionado = membros.find((membro) => membro.usuarioId === usuarioId)
    const responsavelSelecionado = membroSelecionado?.usuario.papel === 'ESTABLISHMENT_OWNER'
    const profissionalSelecionado = profissionais.find((profissional) => profissional.id === profissionalId)
    const contas = Array.from(new Map([...usuarios, ...membros.map((item) => item.usuario)].map((conta) => [conta.id, conta])).values())
    const selecionarUsuario = (id: number) => {
        setUsuarioId(id); setResultado(null)
        const membro = membros.find((item) => item.usuarioId === id)
        if (membro) {
            setProfissionalId(membro.profissionalId ?? null); setPapel(membro.usuario.papel === 'ESTABLISHMENT_OWNER' ? 'GESTOR' : membro.papel)
            setPermissoes(membro.usuario.papel === 'ESTABLISHMENT_OWNER' ? PERMISSOES.map((item) => item.id) : membro.permissoes)
        } else if (membroSelecionado) {
            setProfissionalId(null); setPapel('PROFISSIONAL'); setPermissoes(['AGENDA_GERENCIAR'])
        }
    }
    const selecionarProfissional = (id: number) => {
        const membro = membros.find((item) => item.profissionalId === id)
        if (membro) selecionarUsuario(membro.usuarioId)
        else if (membroSelecionado?.profissionalId) {
            setUsuarioId(null); setPapel('PROFISSIONAL'); setPermissoes(['AGENDA_GERENCIAR'])
        }
        setProfissionalId(id); setResultado(null)
    }
    const alternar = (id: PermissaoEquipe) => setPermissoes((atuais) => atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id])
    const removerMembro = (membro: MembroEquipe) => Alert.alert('Remover membro', `Remover ${membro.usuario.nome} da equipe? O usuário e o perfil profissional não serão excluídos.`, [
        { text: 'Cancelar', style: 'cancel' }, { text: 'Remover', style: 'destructive', onPress: () => { void remover(membro.id) } },
    ])
    const submeter = async () => {
        if (!usuarioId || salvando) return
        setSalvando(true); setResultado(null)
        try {
            const sucesso = await salvar({ usuarioId, profissionalId, papel, permissoes, ativo: membroSelecionado?.ativo }, membroSelecionado?.id)
            if (sucesso) { setUsuarioId(null); setProfissionalId(null) }
            setResultado(sucesso ? 'sucesso' : 'erro')
        } finally { setSalvando(false) }
    }
    return <View style={styles.lista}><View style={[styles.bloco, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <Text style={[styles.subtitulo, { color: cores.texto }]}>{membroSelecionado ? 'Editar acesso do membro' : 'Vincular usuário à equipe'}</Text>
        <Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Conta de acesso (obrigatória)</Text><Chips itens={contas.map((item) => ({ id: item.id, nome: `${item.nome} · ${item.email}` }))} atual={usuarioId} selecionar={selecionarUsuario} desabilitado={salvando} />
        {!usuarios.length ? <Text style={[styles.aviso, { color: cores.textoSecundario }]}>Não há novas contas da unidade disponíveis para vincular. Você pode selecionar um membro existente para editar seu acesso. Cadastrar um profissional não cria uma conta de acesso; permissões só podem ser atribuídas a uma conta vinculada à unidade.</Text> : null}
        <Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Papel</Text><Chips itens={['GESTOR', 'RECEPCIONISTA', 'PROFISSIONAL'].map((id) => ({ id, nome: id }))} atual={papel} selecionar={setPapel} desabilitado={salvando || responsavelSelecionado} />
        <Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Perfil profissional opcional</Text><Chips itens={profissionais.map((item) => ({ id: item.id, nome: item.nome }))} atual={profissionalId} selecionar={selecionarProfissional} desabilitado={salvando} />
        {!usuarioId ? <Text accessibilityRole="alert" style={[styles.aviso, { color: cores.textoSecundario }]}>{profissionalSelecionado ? `Perfil selecionado: ${profissionalSelecionado.nome}. Selecione acima a conta de acesso dessa pessoa para atribuir permissões. O perfil profissional sozinho não cria um login.` : 'Selecione a conta de acesso para habilitar o salvamento das permissões.'}</Text> : null}
        <View style={styles.cabecalhoPermissoes}><Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Permissões</Text><View style={styles.atalhosPermissoes}>
            <Pressable disabled={salvando || responsavelSelecionado} onPress={() => setPermissoes(PERMISSOES.map((item) => item.id))}><Text style={styles.atalhoPermissao}>Selecionar todas</Text></Pressable>
            <Pressable disabled={salvando || responsavelSelecionado} onPress={() => setPermissoes([])}><Text style={styles.atalhoRemover}>Remover todas</Text></Pressable>
        </View></View><View style={styles.chips}>{PERMISSOES.map((item) => <Chip key={item.id} nome={item.nome} ativo={permissoes.includes(item.id)} acao={() => alternar(item.id)} desabilitado={salvando || responsavelSelecionado} />)}</View>
        {responsavelSelecionado ? <Text style={styles.protegido}>Responsável principal · acesso total protegido</Text> : null}
        <Botao texto={salvando ? 'Salvando membro...' : membroSelecionado ? 'Salvar permissões do membro' : 'Adicionar membro'} acao={submeter} desabilitado={!usuarioId || salvando} />
        {resultado === 'sucesso' ? <FeedbackSucesso mensagem="Acesso do membro salvo." /> : null}
        {resultado === 'erro' ? <Text accessibilityRole="alert" style={styles.erro}>{erro ?? 'Não foi possível adicionar o membro. Tente novamente.'}</Text> : null}
    </View>{membros.map((item) => {
        const responsavelPrincipal = item.usuario.papel === 'ESTABLISHMENT_OWNER'
        return <View key={item.id} style={[styles.bloco, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <Text style={[styles.nome, { color: cores.texto }]}>{item.usuario.nome}</Text><Text style={[styles.texto, { color: cores.textoSecundario }]}>{item.papel} · {item.profissional?.nome ?? 'Sem perfil profissional'}</Text>
        {responsavelPrincipal ? <Text style={styles.protegido}>Responsável principal · acesso total protegido</Text> : null}
        <Text style={[styles.texto, { color: cores.textoSecundario }]}>{item.permissoes.map((id) => PERMISSOES.find((p) => p.id === id)?.nome ?? id).join(' · ') || 'Sem permissões operacionais'}</Text>
        {!item.profissional ? <VincularPerfil membro={item} profissionais={profissionais.filter((profissional) => !membros.some((membro) => membro.profissionalId === profissional.id))} salvar={salvar} criarPerfil={criarPerfil} /> : null}
        {!responsavelPrincipal ? <Pressable onPress={() => removerMembro(item)} style={styles.botaoRemover}><Text style={styles.botaoRemoverTexto}>Remover membro</Text></Pressable> : null}
    </View>})}</View>
}

function VincularPerfil({ membro, profissionais, salvar, criarPerfil }: {
    membro: MembroEquipe; profissionais: ProfissionalOperacional[]
    salvar: (dados: { usuarioId: number; profissionalId?: number | null; papel: string; permissoes: PermissaoEquipe[]; ativo?: boolean }, membroId?: number) => Promise<boolean>
    criarPerfil: (membro: MembroEquipe, sexo: 'MASCULINO' | 'FEMININO') => Promise<boolean>
}) {
    const { cores } = useTema()
    const [criando, setCriando] = useState(false)
    const [sexo, setSexo] = useState<'MASCULINO' | 'FEMININO' | null>(null)
    const [profissionalId, setProfissionalId] = useState<number | null>(profissionais.length === 1 ? profissionais[0].id : null)
    useEffect(() => { if (profissionais.length === 1) setProfissionalId(profissionais[0].id) }, [profissionais])
    if (!profissionais.length) return <View style={styles.vinculo}><Text style={[styles.aviso, { color: cores.textoSecundario }]}>Ainda não existe um perfil profissional para este membro.</Text>
        <Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Sexo</Text><Chips itens={[{ id: 'MASCULINO' as const, nome: 'Masculino' }, { id: 'FEMININO' as const, nome: 'Feminino' }]} atual={sexo} selecionar={setSexo} />
        <Botao texto={criando ? 'Criando perfil...' : `Criar e vincular perfil de ${membro.usuario.nome}`} desabilitado={criando || !sexo} acao={async () => { if (!sexo) return; setCriando(true); await criarPerfil(membro, sexo); setCriando(false) }} /></View>
    const vincular = () => profissionalId && salvar({
        usuarioId: membro.usuarioId, profissionalId, papel: membro.papel,
        permissoes: membro.permissoes, ativo: membro.ativo,
    }, membro.id)
    return <View style={styles.vinculo}><Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Vincular perfil profissional</Text>
        <Chips itens={profissionais.map((item) => ({ id: item.id, nome: item.nome }))} atual={profissionalId} selecionar={setProfissionalId} />
        <Botao texto={profissionais.length === 1 ? `Vincular ${profissionais[0].nome}` : 'Vincular perfil selecionado'} acao={vincular} desabilitado={!profissionalId} /></View>
}

export function EscalasEquipe({ profissionais, buscar, salvar, erro }: {
    profissionais: ProfissionalOperacional[]; buscar: (id: number) => Promise<EscalaProfissional[]>; salvar: (id: number, escalas: EscalaProfissional[]) => Promise<boolean>
    erro?: string | null
}) {
    const { cores } = useTema(); const [profissionalId, setProfissionalId] = useState<number | null>(null)
    const [escalas, setEscalas] = useState<EscalaProfissional[]>([]); const [inicio, setInicio] = useState('09:00'); const [fim, setFim] = useState('18:00')
    const [carregando, setCarregando] = useState(false); const [salvando, setSalvando] = useState(false)
    const [erroLocal, setErroLocal] = useState<string | null>(null)
    const [resultado, setResultado] = useState<'sucesso' | 'erro' | null>(null)
    const consulta = useRef(0)
    const selecionar = async (id: number) => {
        const atual = ++consulta.current
        setProfissionalId(id); setEscalas([]); setCarregando(true); setErroLocal(null); setResultado(null)
        try {
            const itens = await buscar(id)
            if (atual !== consulta.current) return
            setEscalas(itens)
            setInicio(itens[0]?.inicio ?? '09:00'); setFim(itens[0]?.fim ?? '18:00')
        } catch (e) { if (atual === consulta.current) setErroLocal(mensagemDoErro(e)) }
        finally { if (atual === consulta.current) setCarregando(false) }
    }
    const submeter = async () => {
        if (!profissionalId || carregando || salvando || erroLocal) return
        setSalvando(true); setResultado(null)
        try { setResultado(await salvar(profissionalId, escalas) ? 'sucesso' : 'erro') }
        finally { setSalvando(false) }
    }
    const alternarDia = (diaSemana: number) => setEscalas((atuais) => atuais.some((item) => item.diaSemana === diaSemana)
        ? atuais.filter((item) => item.diaSemana !== diaSemana) : [...atuais, { diaSemana, inicio, fim, ativo: true }])
    const atualizarHorarios = (campo: 'inicio' | 'fim', valor: string) => { campo === 'inicio' ? setInicio(valor) : setFim(valor); setEscalas((atuais) => atuais.map((item) => ({ ...item, [campo]: valor }))) }
    return <View style={[styles.bloco, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.subtitulo, { color: cores.texto }]}>Escala individual</Text>
        <Chips itens={profissionais.map((item) => ({ id: item.id, nome: item.nome }))} atual={profissionalId} selecionar={selecionar} desabilitado={salvando} />
        {carregando ? <Text style={{ color: cores.textoSecundario }}>Carregando escala...</Text> : null}
        {erroLocal ? <><Text accessibilityRole="alert" style={styles.erro}>{erroLocal}</Text><Botao texto="Tentar carregar novamente" acao={() => { if (profissionalId) void selecionar(profissionalId) }} /></> : null}
        {profissionalId && !carregando && !erroLocal ? <View pointerEvents={salvando ? 'none' : 'auto'}><View style={styles.campos}><CampoTexto label="Início (HH:MM)" value={inicio} maxLength={5} onChangeText={(v) => atualizarHorarios('inicio', v)} /><CampoTexto label="Fim (HH:MM)" value={fim} maxLength={5} onChangeText={(v) => atualizarHorarios('fim', v)} /></View>
            <View style={styles.chips}>{DIAS.map((nome, dia) => <Chip key={nome} nome={nome} ativo={escalas.some((item) => item.diaSemana === dia)} acao={() => alternarDia(dia)} />)}</View>
            {escalas.map((escala, indice) => <View key={escala.diaSemana} style={styles.campos}>
                <Text style={{ color: cores.textoSecundario }}>{DIAS[escala.diaSemana]} — intervalo opcional (vazio: sem pausa fixa)</Text>
                <CampoTexto label="Início do intervalo (HH:MM)" value={escala.intervaloInicio ?? ''} onChangeText={(valor) => setEscalas((itens) => itens.map((item, atual) => atual === indice ? { ...item, intervaloInicio: valor } : item))} maxLength={5} />
                <CampoTexto label="Fim do intervalo (HH:MM)" value={escala.intervaloFim ?? ''} onChangeText={(valor) => setEscalas((itens) => itens.map((item, atual) => atual === indice ? { ...item, intervaloFim: valor } : item))} maxLength={5} />
                <Botao texto="Sem pausa fixa" acao={() => setEscalas((itens) => itens.map((item, atual) => atual === indice ? { ...item, intervaloInicio: null, intervaloFim: null } : item))} />
            </View>)}
            <Botao texto={salvando ? 'Salvando escala...' : 'Salvar escala'} acao={submeter} desabilitado={salvando} />
            {resultado === 'sucesso' ? <FeedbackSucesso mensagem="Escala salva." /> : null}
            {resultado === 'erro' ? <Text accessibilityRole="alert" style={styles.erro}>{erro ?? 'Não foi possível salvar a escala. Tente novamente.'}</Text> : null}
        </View> : !profissionalId ? <Text style={[styles.texto, { color: cores.textoSecundario }]}>Selecione um profissional.</Text> : null}
    </View>
}

function Chips<T extends number | string>({ itens, atual, selecionar, desabilitado }: { itens: Array<{ id: T; nome: string }>; atual: T | null; selecionar: (id: T) => void; desabilitado?: boolean }) {
    return <View style={styles.chips}>{itens.map((item) => <Chip key={String(item.id)} nome={item.nome} ativo={atual === item.id} acao={() => selecionar(item.id)} desabilitado={desabilitado} />)}</View>
}
function Chip({ nome, ativo, acao, desabilitado }: { nome: string; ativo: boolean; acao: () => void; desabilitado?: boolean }) { const { cores } = useTema(); return <Pressable disabled={desabilitado} onPress={acao} style={[styles.chip, { borderColor: ativo ? cores.destaque : cores.borda, backgroundColor: ativo ? cores.destaque : 'transparent' }]}><Text style={{ color: ativo ? cores.destaqueTexto : cores.texto, fontSize: 11, fontWeight: '800' }}>{nome}</Text></Pressable> }
function Botao({ texto, acao, desabilitado }: { texto: string; acao: () => void; desabilitado?: boolean }) { return <Pressable disabled={desabilitado} onPress={acao} style={[styles.botao, desabilitado && styles.desabilitado]}><Text style={styles.botaoTexto}>{texto}</Text></Pressable> }

const styles = StyleSheet.create({
    erro: { color: '#B42318', fontSize: 13, lineHeight: 19 },
    lista: { gap: 10 }, bloco: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 9 }, subtitulo: { fontSize: 17, fontWeight: '900' }, nome: { fontSize: 15, fontWeight: '800' }, texto: { lineHeight: 19 }, protegido: { color: '#2563EB', fontSize: 12, fontWeight: '900' }, aviso: { fontSize: 12, lineHeight: 17 }, vinculo: { gap: 7, marginTop: 4 }, rotulo: { fontSize: 12, fontWeight: '700', marginTop: 3 }, cabecalhoPermissoes: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, atalhosPermissoes: { flexDirection: 'row', gap: 12 }, atalhoPermissao: { color: '#2563EB', fontSize: 12, fontWeight: '800' }, atalhoRemover: { color: '#B42318', fontSize: 12, fontWeight: '800' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }, campos: { gap: 6 }, botao: { minHeight: 44, borderRadius: 10, backgroundColor: '#E7B84B', alignItems: 'center', justifyContent: 'center', marginTop: 4 }, botaoTexto: { color: '#081426', fontWeight: '900' }, botaoRemover: { minHeight: 42, borderWidth: 1, borderColor: '#B42318', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, botaoRemoverTexto: { color: '#B42318', fontWeight: '900' }, desabilitado: { opacity: .45 },
})

