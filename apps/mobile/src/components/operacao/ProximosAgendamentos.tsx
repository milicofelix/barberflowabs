import EstadoErro from '@/src/components/shared/EstadoErro'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useAPI, { ErroAPI, mensagemDoErro } from '@/src/data/hooks/useAPI'
import { useNavigation } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { AbasParamList } from '@/src/navigation/types'
import useTema from '@/src/data/contexts/ContextoTema'
import useSessao from '@/src/data/hooks/useSessao'
import useSincronizacaoAtendimentos from '@/src/data/hooks/useSincronizacaoAtendimentos'
import type { AgendamentoOperacional, PermissaoEquipe } from '@/src/data/operacao/tipos'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native'
import CartaoAtendimento from './CartaoAtendimento'

export default function ProximosAgendamentos({ cabecalho }: { cabecalho?: ReactNode }) {
    const { cores } = useTema(); const { usuario } = useSessao()
    const { httpGet } = useAPI()
    const navigation = useNavigation<BottomTabNavigationProp<AbasParamList>>()
    const [itens, setItens] = useState<AgendamentoOperacional[]>([])
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const requisicao = useRef(0)
    const carregar = useCallback(async () => {
        const atual = ++requisicao.current
        try {
            setCarregando(true)
            const permissoes = await httpGet<PermissaoEquipe[]>('/equipe/minhas-permissoes')
            if (atual !== requisicao.current) return false
            if (!permissoes.includes('AGENDA_GERENCIAR')) {
                setItens([]); throw new Error('Você não tem permissão para consultar a agenda.')
            }
            const lista = await httpGet<AgendamentoOperacional[]>('/gestao/atendimentos/home')
            if (atual !== requisicao.current) return false
            setItens(Array.from(new Map(lista.map((item) => [item.id, item])).values())); setErro(null)
            return true
        } catch (error) { if (atual === requisicao.current) { if (error instanceof ErroAPI && [401, 403].includes(error.status)) setItens([]); setErro(mensagemDoErro(error)) } return false }
        finally { if (atual === requisicao.current) setCarregando(false) }
    }, [httpGet])
    useEffect(() => { setItens([]); return () => { requisicao.current++ } }, [carregar, usuario?.estabelecimentoId, usuario?.id])
    const agora = useSincronizacaoAtendimentos(carregar)
    return <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}>
        {cabecalho}
        <Text style={[styles.titulo, { color: cores.texto }]}>Próximos agendamentos</Text>
        <Text style={{ color: cores.textoSecundario }}>Atendimentos da unidade e finalizados nas últimas 24 horas.</Text>
        {erro ? <EstadoErro mensagem={erro} tentarNovamente={carregar} /> : null}
        {!carregando && !erro && !itens.length ? <EstadoVazio titulo="Nenhum atendimento" descricao="Novos horários aparecerão aqui assim que forem reservados." /> : null}
        {itens.map((item) => <CartaoAtendimento key={item.id} item={item} agora={agora} abrirAgenda={() => navigation.navigate('Operacao', { agendamentoId: item.id, chave: Date.now() })} aoAtualizar={(atualizado) => setItens((atuais) => atuais.map((atual) => atual.id === atualizado.id ? atualizado : atual))} />)}
    </ScrollView>
}
const styles = StyleSheet.create({ conteudo: { padding: 18, paddingBottom: 40, gap: 12 }, titulo: { fontSize: 29, fontWeight: '900' } })
