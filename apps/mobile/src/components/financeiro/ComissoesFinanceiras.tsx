import CampoTexto from '@/src/components/shared/CampoTexto'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import SeletorBuscaFinanceiro from './SeletorBuscaFinanceiro'
import useTema from '@/src/data/contexts/ContextoTema'
import type { ConfiguracaoComissao, ServicoFinanceiro } from '@/src/data/financeiro/tipos'
import type { ProfissionalOperacional } from '@/src/data/operacao/tipos'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Payload { profissionalId?: number | null; servicoId?: number | null; percentual: number; ativo?: boolean }
interface Props {
    regras: ConfiguracaoComissao[]; profissionais: ProfissionalOperacional[]; servicos: ServicoFinanceiro[]
    podeGerenciar: boolean; executando: boolean; salvar: (dados: Payload) => Promise<boolean>
}

export default function ComissoesFinanceiras({ regras, profissionais, servicos, podeGerenciar, executando, salvar }: Props) {
    const { cores } = useTema()
    const [profissionalId, setProfissionalId] = useState<number | null>(null)
    const [servicoId, setServicoId] = useState<number | null>(null)
    const [percentual, setPercentual] = useState('40')
    const valor = Number(percentual.replace(',', '.'))
    const invalido = !Number.isFinite(valor) || valor < 0 || valor > 100

    return <View style={styles.container}>
        {podeGerenciar ? <View style={[styles.formulario, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <Text style={[styles.titulo, { color: cores.texto }]}>Configurar comissão</Text>
            <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>Sem seleção cria a regra padrão. Selecionar ambos cria a regra mais específica.</Text>
            <SeletorBuscaFinanceiro label="Profissional (opcional)" itens={profissionais} selecionado={profissionalId} selecionar={setProfissionalId} />
            <SeletorBuscaFinanceiro label="Serviço (opcional)" itens={servicos} selecionado={servicoId} selecionar={setServicoId} />
            <CampoTexto label="Percentual" value={percentual} onChangeText={setPercentual} keyboardType="decimal-pad" error={invalido ? 'Informe um percentual entre 0 e 100.' : undefined} />
            <Pressable disabled={executando || invalido} onPress={() => salvar({ profissionalId, servicoId, percentual: valor })}
                style={[styles.botao, { backgroundColor: cores.destaque }, (executando || invalido) && styles.desabilitado]}><Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{executando ? 'Salvando...' : 'Salvar regra'}</Text></Pressable>
        </View> : null}
        <Text style={[styles.titulo, { color: cores.texto }]}>Regras de comissão</Text>
        <View style={[styles.prioridade, { backgroundColor: cores.superficieElevada }]}><Text style={{ color: cores.textoSecundario, fontSize: 12 }}>Prioridade: combinação → serviço → profissional → padrão.</Text></View>
        {!regras.length ? <EstadoVazio titulo="Nenhuma regra de comissão" /> : regras.map((regra) => <View key={regra.id} style={[styles.item, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.linha}><Text style={[styles.nome, { color: cores.texto }]}>{nomeDaRegra(regra)}</Text><Text style={{ color: regra.ativo ? cores.sucesso : cores.textoSecundario, fontWeight: '900' }}>{regra.ativo ? 'ATIVA' : 'INATIVA'}</Text></View>
            <Text style={[styles.percentual, { color: cores.destaque }]}>{Number(regra.percentual)}%</Text>
            <Text style={[styles.ajuda, { color: cores.textoSecundario }]}>{prioridade(regra)} · {regra.chave}</Text>
            {podeGerenciar ? <Pressable disabled={executando} onPress={() => salvar({ profissionalId: regra.profissionalId, servicoId: regra.servicoId, percentual: Number(regra.percentual), ativo: !regra.ativo })}
                style={[styles.acao, { borderColor: regra.ativo ? cores.perigo : cores.sucesso }]}><Text style={{ color: regra.ativo ? cores.perigo : cores.sucesso, fontWeight: '800' }}>{regra.ativo ? 'Desativar' : 'Ativar'}</Text></Pressable> : null}
        </View>)}
    </View>
}

function nomeDaRegra(regra: ConfiguracaoComissao) {
    if (regra.profissional && regra.servico) return `${regra.profissional.nome} · ${regra.servico.nome}`
    return regra.servico?.nome ?? regra.profissional?.nome ?? 'Comissão padrão'
}
function prioridade(regra: ConfiguracaoComissao) {
    if (regra.profissionalId && regra.servicoId) return 'Prioridade 1 — combinação'
    if (regra.servicoId) return 'Prioridade 2 — serviço'
    if (regra.profissionalId) return 'Prioridade 3 — profissional'
    return 'Prioridade 4 — padrão'
}

const styles = StyleSheet.create({
    container: { gap: 11 }, formulario: { borderWidth: 1, borderRadius: 14, padding: 15 }, titulo: { fontSize: 18, fontWeight: '900', marginBottom: 6 },
    ajuda: { fontSize: 12, lineHeight: 18 }, botao: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11 }, desabilitado: { opacity: 0.5 },
    prioridade: { borderRadius: 10, padding: 11 }, item: { borderWidth: 1, borderRadius: 13, padding: 14, gap: 5 }, linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    nome: { flex: 1, fontSize: 15, fontWeight: '900' }, percentual: { fontSize: 20, fontWeight: '900' }, acao: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9, marginTop: 4 },
})
