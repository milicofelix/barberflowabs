import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { dataAtendimento } from '@uniflowabs/core'
import type { AgendamentoOperacional, PermissaoEquipe } from '@/src/data/operacao/tipos'
import useAPI, { ErroAPI, mensagemDoErro } from '@/src/data/hooks/useAPI'
import useTema from '@/src/data/contexts/ContextoTema'
import useSincronizacaoAtendimentos from '@/src/data/hooks/useSincronizacaoAtendimentos'
import CartaoAtendimento from './CartaoAtendimento'

export default function DetalheAtendimentoNotificacao({ id, fechar, alterarData }: {
    id: number; fechar: () => void; alterarData: (data: string) => void
}) {
    const { cores } = useTema(); const { httpGet } = useAPI()
    const [item, setItem] = useState<AgendamentoOperacional | null>(null); const [erro, setErro] = useState('')
    const vivo = useRef(true); const diaDefinido = useRef(false)
    useEffect(() => { vivo.current = true; return () => { vivo.current = false } }, [])
    const carregar = useCallback(async () => {
        try {
            const acessos = await httpGet<PermissaoEquipe[]>('/equipe/minhas-permissoes')
            if (!acessos.includes('AGENDA_GERENCIAR')) { if (vivo.current) setItem(null); throw new Error('Você não tem permissão para consultar este atendimento.') }
            const detalhe = await httpGet<AgendamentoOperacional>(`/gestao/agendamentos/${id}`)
            if (!vivo.current) return false
            if (detalhe.id !== id) throw new Error('Atendimento não encontrado nesta unidade.')
            setItem(detalhe); setErro('')
            if (!diaDefinido.current) { diaDefinido.current = true; alterarData(dataAtendimento(detalhe)) }
            return true
        } catch (e) { if (vivo.current) { if (e instanceof ErroAPI && [401, 403, 404].includes(e.status)) setItem(null); setErro(mensagemDoErro(e)) } return false }
    }, [id, httpGet, alterarData])
    const agora = useSincronizacaoAtendimentos(carregar)
    return <Modal visible transparent animationType="fade" onRequestClose={fechar}>
        <View style={{ flex: 1, padding: 18, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.65)' }}>
            <View style={{ maxHeight: '90%', backgroundColor: cores.superficie, borderRadius: 14, padding: 12, gap: 12 }}>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 12 }}>
                <Text accessibilityRole="header" style={{ color: cores.texto, fontWeight: '800' }}>Atendimento #{id}</Text>
                {erro ? <><Text accessibilityRole="alert" style={{ color: cores.perigo }}>{erro}</Text><Pressable accessibilityRole="button" onPress={carregar} style={{ minHeight: 44 }}><Text style={{ color: cores.texto }}>Tentar novamente</Text></Pressable></> : null}
                {!item && !erro ? <Text style={{ color: cores.texto }}>Carregando atendimento…</Text> : null}
                {item ? <CartaoAtendimento item={item} agora={agora} aoAtualizar={setItem} /> : null}
            </ScrollView>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar detalhes sem alterar atendimento" onPress={fechar} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: cores.destaque, borderRadius: 10 }}><Text style={{ color: cores.destaqueTexto, fontWeight: '800' }}>Fechar</Text></Pressable>
            </View>
        </View>
    </Modal>
}
