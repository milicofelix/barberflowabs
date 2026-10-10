import CampoTexto from '@/src/components/shared/CampoTexto'
import useTema from '@/src/data/contexts/ContextoTema'
import type { EscalaProfissional, MembroEquipe, PermissaoEquipe, ProfissionalOperacional, UsuarioEquipe } from '@/src/data/operacao/tipos'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

const PERMISSOES: Array<{ id: PermissaoEquipe; nome: string }> = [
    { id: 'EQUIPE_GERENCIAR', nome: 'Equipe' }, { id: 'ESCALAS_GERENCIAR', nome: 'Escalas' },
    { id: 'RECURSOS_GERENCIAR', nome: 'Recursos' }, { id: 'AGENDA_GERENCIAR', nome: 'Agenda' },
    { id: 'FINANCEIRO_VISUALIZAR', nome: 'Visualizar financeiro' },
    { id: 'FINANCEIRO_GERENCIAR', nome: 'Gerenciar financeiro' },
    { id: 'FINANCEIRO_AUDITAR', nome: 'Auditar financeiro' },
    { id: 'CONFIGURACOES_GERENCIAR', nome: 'Configurações' },
]
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function MembrosEquipe({ membros, usuarios, profissionais, salvar }: {
    membros: MembroEquipe[]; usuarios: UsuarioEquipe[]; profissionais: ProfissionalOperacional[]
    salvar: (dados: { usuarioId: number; profissionalId?: number | null; papel: string; permissoes: PermissaoEquipe[] }) => Promise<boolean>
}) {
    const { cores } = useTema(); const [usuarioId, setUsuarioId] = useState<number | null>(null)
    const [profissionalId, setProfissionalId] = useState<number | null>(null); const [papel, setPapel] = useState('PROFISSIONAL')
    const [permissoes, setPermissoes] = useState<PermissaoEquipe[]>(['AGENDA_GERENCIAR'])
    const alternar = (id: PermissaoEquipe) => setPermissoes((atuais) => atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id])
    const submeter = async () => {
        if (!usuarioId) return
        if (await salvar({ usuarioId, profissionalId, papel, permissoes })) { setUsuarioId(null); setProfissionalId(null) }
    }
    return <View style={styles.lista}><View style={[styles.bloco, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <Text style={[styles.subtitulo, { color: cores.texto }]}>Vincular usuário à equipe</Text>
        <Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Usuário</Text><Chips itens={usuarios.map((item) => ({ id: item.id, nome: item.nome }))} atual={usuarioId} selecionar={setUsuarioId} />
        <Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Papel</Text><Chips itens={['GESTOR', 'RECEPCIONISTA', 'PROFISSIONAL'].map((id) => ({ id, nome: id }))} atual={papel} selecionar={setPapel} />
        <Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Perfil profissional opcional</Text><Chips itens={profissionais.map((item) => ({ id: item.id, nome: item.nome }))} atual={profissionalId} selecionar={setProfissionalId} />
        <Text style={[styles.rotulo, { color: cores.textoSecundario }]}>Permissões</Text><View style={styles.chips}>{PERMISSOES.map((item) => <Chip key={item.id} nome={item.nome} ativo={permissoes.includes(item.id)} acao={() => alternar(item.id)} />)}</View>
        <Botao texto="Adicionar membro" acao={submeter} desabilitado={!usuarioId} />
    </View>{membros.map((item) => <View key={item.id} style={[styles.bloco, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
        <Text style={[styles.nome, { color: cores.texto }]}>{item.usuario.nome}</Text><Text style={[styles.texto, { color: cores.textoSecundario }]}>{item.papel} · {item.profissional?.nome ?? 'Sem perfil profissional'}</Text>
        <Text style={[styles.texto, { color: cores.textoSecundario }]}>{item.permissoes.map((id) => PERMISSOES.find((p) => p.id === id)?.nome ?? id).join(' · ') || 'Sem permissões operacionais'}</Text>
    </View>)}</View>
}

export function EscalasEquipe({ profissionais, buscar, salvar }: {
    profissionais: ProfissionalOperacional[]; buscar: (id: number) => Promise<EscalaProfissional[]>; salvar: (id: number, escalas: EscalaProfissional[]) => Promise<boolean>
}) {
    const { cores } = useTema(); const [profissionalId, setProfissionalId] = useState<number | null>(null)
    const [escalas, setEscalas] = useState<EscalaProfissional[]>([]); const [inicio, setInicio] = useState('09:00'); const [fim, setFim] = useState('18:00')
    const selecionar = async (id: number) => { setProfissionalId(id); setEscalas(await buscar(id)) }
    const alternarDia = (diaSemana: number) => setEscalas((atuais) => atuais.some((item) => item.diaSemana === diaSemana)
        ? atuais.filter((item) => item.diaSemana !== diaSemana) : [...atuais, { diaSemana, inicio, fim, ativo: true }])
    const atualizarHorarios = (campo: 'inicio' | 'fim', valor: string) => { campo === 'inicio' ? setInicio(valor) : setFim(valor); setEscalas((atuais) => atuais.map((item) => ({ ...item, [campo]: valor }))) }
    return <View style={[styles.bloco, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.subtitulo, { color: cores.texto }]}>Escala individual</Text>
        <Chips itens={profissionais.map((item) => ({ id: item.id, nome: item.nome }))} atual={profissionalId} selecionar={selecionar} />
        {profissionalId ? <><View style={styles.campos}><CampoTexto label="Início" value={inicio} onChangeText={(v) => atualizarHorarios('inicio', v)} /><CampoTexto label="Fim" value={fim} onChangeText={(v) => atualizarHorarios('fim', v)} /></View>
            <View style={styles.chips}>{DIAS.map((nome, dia) => <Chip key={nome} nome={nome} ativo={escalas.some((item) => item.diaSemana === dia)} acao={() => alternarDia(dia)} />)}</View>
            <Botao texto="Salvar escala" acao={() => salvar(profissionalId, escalas)} /></> : <Text style={[styles.texto, { color: cores.textoSecundario }]}>Selecione um profissional.</Text>}
    </View>
}

function Chips<T extends number | string>({ itens, atual, selecionar }: { itens: Array<{ id: T; nome: string }>; atual: T | null; selecionar: (id: T) => void }) {
    return <View style={styles.chips}>{itens.map((item) => <Chip key={String(item.id)} nome={item.nome} ativo={atual === item.id} acao={() => selecionar(item.id)} />)}</View>
}
function Chip({ nome, ativo, acao }: { nome: string; ativo: boolean; acao: () => void }) { const { cores } = useTema(); return <Pressable onPress={acao} style={[styles.chip, { borderColor: ativo ? cores.destaque : cores.borda, backgroundColor: ativo ? cores.destaque : 'transparent' }]}><Text style={{ color: ativo ? cores.destaqueTexto : cores.texto, fontSize: 11, fontWeight: '800' }}>{nome}</Text></Pressable> }
function Botao({ texto, acao, desabilitado }: { texto: string; acao: () => void; desabilitado?: boolean }) { return <Pressable disabled={desabilitado} onPress={acao} style={[styles.botao, desabilitado && styles.desabilitado]}><Text style={styles.botaoTexto}>{texto}</Text></Pressable> }

const styles = StyleSheet.create({
    lista: { gap: 10 }, bloco: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 9 }, subtitulo: { fontSize: 17, fontWeight: '900' }, nome: { fontSize: 15, fontWeight: '800' }, texto: { lineHeight: 19 }, rotulo: { fontSize: 12, fontWeight: '700', marginTop: 3 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 }, campos: { gap: 6 }, botao: { minHeight: 44, borderRadius: 10, backgroundColor: '#E7B84B', alignItems: 'center', justifyContent: 'center', marginTop: 4 }, botaoTexto: { color: '#081426', fontWeight: '900' }, desabilitado: { opacity: .45 },
})

