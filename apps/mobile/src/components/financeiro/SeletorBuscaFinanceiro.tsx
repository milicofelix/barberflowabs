import CampoTexto from '@/src/components/shared/CampoTexto'
import useTema from '@/src/data/contexts/ContextoTema'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Item { id: number; nome: string }
interface Props { label: string; itens: Item[]; selecionado?: number | null; selecionar: (id: number | null) => void }
interface OpcaoProps { nome: string; ativo: boolean; acao: () => void }

export default function SeletorBuscaFinanceiro({ label, itens, selecionado, selecionar }: Props) {
    const [busca, setBusca] = useState('')
    const filtrados = useMemo(() => itens.filter((item) => normalizar(item.nome).includes(normalizar(busca))).slice(0, 20), [busca, itens])

    return <View style={styles.container}>
        <CampoTexto label={label} value={busca} onChangeText={setBusca} placeholder="Buscar..." />
        <View style={styles.opcoes}>
            <Opcao nome="Todos" ativo={!selecionado} acao={() => selecionar(null)} />
            {filtrados.map((item) => <Opcao key={item.id} nome={item.nome} ativo={selecionado === item.id} acao={() => selecionar(item.id)} />)}
        </View>
    </View>
}

function Opcao({ nome, ativo, acao }: OpcaoProps) {
    const { cores } = useTema()
    return <Pressable onPress={acao} style={[styles.opcao, { borderColor: cores.borda }, ativo && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}> 
        <Text style={{ color: ativo ? cores.destaqueTexto : cores.texto, fontSize: 12, fontWeight: '800' }}>{nome}</Text>
    </Pressable>
}

const normalizar = (valor: string) => valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const styles = StyleSheet.create({ container: { marginBottom: 4 }, opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: -8, marginBottom: 12 }, opcao: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 } })
