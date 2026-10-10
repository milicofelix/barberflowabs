import CampoTexto from '@/src/components/shared/CampoTexto'
import useTema from '@/src/data/contexts/ContextoTema'
import type { IndisponibilidadeRecurso, RecursoOperacional } from '@/src/data/operacao/tipos'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

export default function GestaoRecursos({ itens, criar, buscarIndisponibilidades, indisponibilizar, removerIndisponibilidade }: {
    itens: RecursoOperacional[]
    criar: (dados: Omit<RecursoOperacional, 'id'>) => Promise<boolean>
    buscarIndisponibilidades: (id: number) => Promise<IndisponibilidadeRecurso[]>
    indisponibilizar: (id: number, dados: { inicio: string; fim: string; motivo?: string }) => Promise<boolean>
    removerIndisponibilidade: (recursoId: number, id: number) => Promise<boolean>
}) {
    const { cores } = useTema(); const [nome, setNome] = useState(''); const [tipo, setTipo] = useState('CADEIRA'); const [capacidade, setCapacidade] = useState('1')
    const [selecionado, setSelecionado] = useState<number | null>(null); const [indisponibilidades, setIndisponibilidades] = useState<IndisponibilidadeRecurso[]>([])
    const [inicio, setInicio] = useState(''); const [fim, setFim] = useState(''); const [motivo, setMotivo] = useState('')
    const adicionar = async () => { if (nome.trim() && tipo.trim() && await criar({ nome: nome.trim(), tipo: tipo.trim(), capacidade: Number(capacidade), ativo: true })) setNome('') }
    const selecionar = async (id: number) => { setSelecionado(id); setIndisponibilidades(await buscarIndisponibilidades(id)) }
    const bloquear = async () => { if (selecionado && inicio && fim && await indisponibilizar(selecionado, { inicio, fim, motivo })) { setInicio(''); setFim(''); setMotivo(''); setIndisponibilidades(await buscarIndisponibilidades(selecionado)) } }
    const remover = async (id: number) => { if (selecionado && await removerIndisponibilidade(selecionado, id)) setIndisponibilidades((itens) => itens.filter((item) => item.id !== id)) }
    return <View style={styles.lista}><View style={[styles.bloco, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.titulo, { color: cores.texto }]}>Novo recurso</Text>
        <CampoTexto label="Nome" value={nome} onChangeText={setNome} /><CampoTexto label="Tipo" value={tipo} onChangeText={setTipo} /><CampoTexto label="Capacidade simultânea" value={capacidade} onChangeText={setCapacidade} keyboardType="number-pad" /><Botao texto="Adicionar recurso" acao={adicionar} />
    </View>{itens.map((item) => <Pressable key={item.id} onPress={() => selecionar(item.id)} style={[styles.bloco, { backgroundColor: cores.superficie, borderColor: selecionado === item.id ? cores.destaque : cores.borda }]}>
        <Text style={[styles.nome, { color: cores.texto }]}>{item.nome}</Text><Text style={{ color: cores.textoSecundario }}>{item.tipo} · capacidade {item.capacidade} · {item.ativo ? 'Ativo' : 'Inativo'}</Text>
    </Pressable>)}{selecionado ? <View style={[styles.bloco, { backgroundColor: cores.superficie, borderColor: cores.borda }]}><Text style={[styles.titulo, { color: cores.texto }]}>Programar indisponibilidade</Text>
        <Text style={{ color: cores.textoSecundario }}>Use data e hora ISO, por exemplo: 2026-10-15T12:00:00-03:00.</Text><CampoTexto label="Início" value={inicio} onChangeText={setInicio} /><CampoTexto label="Fim" value={fim} onChangeText={setFim} /><CampoTexto label="Motivo" value={motivo} onChangeText={setMotivo} /><Botao texto="Indisponibilizar recurso" acao={bloquear} />
        {indisponibilidades.map((item) => <View key={item.id} style={styles.indisponibilidade}><Text style={{ color: cores.texto }}>{new Date(item.inicio).toLocaleString('pt-BR')} — {new Date(item.fim).toLocaleString('pt-BR')}</Text><Text style={{ color: cores.textoSecundario }}>{item.motivo || 'Sem motivo informado'}</Text><Pressable onPress={() => remover(item.id)}><Text style={styles.remover}>Remover bloqueio</Text></Pressable></View>)}
    </View> : null}</View>
}

function Botao({ texto, acao }: { texto: string; acao: () => void }) { return <Pressable onPress={acao} style={styles.botao}><Text style={styles.botaoTexto}>{texto}</Text></Pressable> }
const styles = StyleSheet.create({ lista: { gap: 10 }, bloco: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 }, titulo: { fontSize: 17, fontWeight: '900' }, nome: { fontSize: 15, fontWeight: '800' }, botao: { minHeight: 44, borderRadius: 10, backgroundColor: '#E7B84B', alignItems: 'center', justifyContent: 'center', marginTop: 4 }, botaoTexto: { color: '#081426', fontWeight: '900' }, indisponibilidade: { borderTopWidth: 1, borderTopColor: '#43516A', paddingTop: 8, gap: 4 }, remover: { color: '#F97066', fontWeight: '800' } })

