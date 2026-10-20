import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { valoresFormularioRelacionamento, type CampoRelacionamento, type DadosRelacionamento, type FormularioRelacionamento } from '@uniflowabs/core'
import useTema from '@/src/data/contexts/ContextoTema'

export interface EdicaoRelacionamento { form: FormularioRelacionamento; registro?: DadosRelacionamento; canal?: string }
export default function FormularioCentral({ edicao, ocupado, erro, fechar, salvar }: {
    edicao: EdicaoRelacionamento; ocupado: boolean; erro: string; fechar: () => void; salvar: (valores: Record<string, string>) => Promise<boolean>
}) {
    const { cores } = useTema()
    const [valores, setValores] = useState(() => valoresFormularioRelacionamento(edicao.form, edicao.registro))
    const [confirmado, setConfirmado] = useState(false)
    return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => { if (!ocupado) fechar() }}><SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text accessibilityRole="header" style={{ flex: 1, color: cores.texto, fontSize: 20, fontWeight: '800' }}>{edicao.form.titulo}</Text><BotaoCentral texto="Fechar" acao={fechar} desabilitado={ocupado} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 18 }}>
            {edicao.form.aviso ? <Text style={{ color: cores.textoSecundario }}>{edicao.form.aviso}</Text> : null}
            {edicao.form.campos.filter(c => !c.oculto).map(c => <CampoCentral key={c.chave} campo={c} valor={valores[c.chave] ?? ''} desabilitado={ocupado} alterar={valor => setValores(v => ({ ...v, [c.chave]: valor }))} />)}
            {edicao.form.confirmar ? <><Text style={{ color: cores.texto }}>{edicao.form.confirmar}</Text><BotaoCentral texto={confirmado ? '✓ Confirmado' : 'Confirmar'} desabilitado={ocupado} acao={() => setConfirmado(v => !v)} /></> : null}
            {erro ? <Text accessibilityRole="alert" style={{ color: cores.texto }}>{erro}</Text> : null}
            <BotaoCentral texto={ocupado ? 'Salvando…' : 'Salvar'} desabilitado={ocupado || (!!edicao.form.confirmar && !confirmado)} acao={() => { void salvar(valores).then(sucesso => { if (sucesso) fechar() }) }} />
        </ScrollView>
    </SafeAreaView></Modal>
}
export function BotaoCentral({ texto, acao, desabilitado = false }: { texto: string; acao: () => void; desabilitado?: boolean }) {
    const { cores } = useTema()
    return <Pressable accessibilityRole="button" accessibilityState={{ disabled: desabilitado }} disabled={desabilitado} onPress={acao} style={{ minHeight: 48, padding: 12, borderWidth: 1, borderRadius: 10, borderColor: cores.borda, backgroundColor: cores.superficie, opacity: desabilitado ? 0.45 : 1, justifyContent: 'center' }}><Text style={{ color: cores.texto, fontWeight: '700' }}>{texto}</Text></Pressable>
}
function CampoCentral({ campo, valor, alterar, desabilitado }: { campo: CampoRelacionamento; valor: string; alterar: (valor: string) => void; desabilitado: boolean }) {
    const { cores } = useTema(); const [busca, setBusca] = useState(''); const [aberto, setAberto] = useState(false)
    const opcoes = campo.tipo === 'booleano' ? [{ valor: 'false', titulo: 'Não' }, { valor: 'true', titulo: 'Sim' }] : campo.opcoes
    const filtradas = opcoes?.filter(o => o.titulo.toLocaleLowerCase().includes(busca.toLocaleLowerCase())) ?? []
    return <View style={{ gap: 8 }}><Text style={{ color: cores.texto, fontWeight: '700' }}>{campo.titulo}</Text>
        {opcoes ? <><BotaoCentral texto={opcoes.find(o => o.valor === valor)?.titulo ?? 'Selecione'} desabilitado={desabilitado} acao={() => setAberto(v => !v)} />
            {aberto ? <View style={{ gap: 6 }}><TextInput accessibilityLabel={`Pesquisar ${campo.titulo}`} value={busca} onChangeText={setBusca} placeholder="Pesquisar opção" placeholderTextColor={cores.textoSecundario} style={{ minHeight: 48, padding: 10, color: cores.texto, backgroundColor: cores.campo, borderRadius: 8 }} />
                {filtradas.slice(0, 20).map(o => <BotaoCentral key={o.valor} texto={`${o.valor === valor ? '✓ ' : ''}${o.titulo}`} desabilitado={desabilitado} acao={() => { alterar(o.valor); setAberto(false); setBusca('') }} />)}
                <Text style={{ color: cores.textoSecundario }}>{filtradas.length > 20 ? 'Exibindo 20 opções. Refine a pesquisa.' : filtradas.length ? '' : 'Nenhuma opção disponível.'}</Text></View> : null}</>
            : <TextInput accessibilityLabel={campo.titulo} editable={!desabilitado} value={valor} onChangeText={alterar} multiline={campo.tipo === 'longo' || campo.tipo === 'niveis'} keyboardType={campo.tipo === 'numero' ? 'number-pad' : 'default'} autoCapitalize="none" placeholder={campo.tipo === 'data' ? 'AAAA-MM-DDTHH:mm (horário local)' : campo.opcional ? 'Opcional' : campo.titulo} placeholderTextColor={cores.textoSecundario} style={{ minHeight: campo.tipo === 'longo' || campo.tipo === 'niveis' ? 110 : 48, padding: 12, color: cores.campoTexto, backgroundColor: cores.campo, borderWidth: 1, borderColor: cores.borda, borderRadius: 10 }} />}
    </View>
}
