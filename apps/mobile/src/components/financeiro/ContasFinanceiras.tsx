import Confirmacao from '@/src/components/shared/Confirmacao'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import FormularioBaixaConta from './FormularioBaixaConta'
import useTema from '@/src/data/contexts/ContextoTema'
import { moeda } from '@/src/data/financeiro/formatacao'
import type { ContaFinanceira, FormaPagamento, StatusConta, TipoConta } from '@/src/data/financeiro/tipos'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Props {
    contas: ContaFinanceira[]; formasPagamento: FormaPagamento[]; podeGerenciar: boolean; executando: boolean
    baixar: (id: number, dados: { valorPago: number; pagoEm: string; formaPagamentoId?: number }) => Promise<boolean>
    cancelar: (id: number) => Promise<boolean>
}

type FiltroTipo = TipoConta | 'TODOS'
type FiltroStatus = StatusConta | 'TODOS'

export default function ContasFinanceiras({ contas, formasPagamento, podeGerenciar, executando, baixar, cancelar }: Props) {
    const { cores } = useTema()
    const [tipo, setTipo] = useState<FiltroTipo>('TODOS')
    const [status, setStatus] = useState<FiltroStatus>('TODOS')
    const [contaBaixa, setContaBaixa] = useState<ContaFinanceira | null>(null)
    const [contaCancelar, setContaCancelar] = useState<ContaFinanceira | null>(null)
    const filtradas = useMemo(() => contas.filter((conta) => (tipo === 'TODOS' || conta.tipo === tipo) && (status === 'TODOS' || conta.status === status)), [contas, status, tipo])

    async function confirmarCancelamento() {
        if (!contaCancelar || executando) return
        if (await cancelar(contaCancelar.id)) setContaCancelar(null)
    }

    return <View style={styles.container}>
        <Text style={[styles.titulo, { color: cores.texto }]}>Contas do período</Text>
        <Filtro titulo="Tipo" itens={['TODOS', 'RECEBER', 'PAGAR']} atual={tipo} selecionar={(item) => setTipo(item as FiltroTipo)} />
        <Filtro titulo="Status" itens={['TODOS', 'PENDENTE', 'PARCIAL', 'ATRASADO', 'PAGO', 'CANCELADO']} atual={status} selecionar={(item) => setStatus(item as FiltroStatus)} />
        {!filtradas.length ? <EstadoVazio titulo="Nenhuma conta encontrada" descricao="Altere os filtros ou o período selecionado." /> : filtradas.map((conta) => {
            const saldo = Number(conta.valorOriginal) - Number(conta.valorPago)
            const aberta = !['PAGO', 'CANCELADO'].includes(conta.status)
            return <View key={conta.id} style={[styles.cartao, { backgroundColor: cores.superficie, borderColor: conta.status === 'ATRASADO' ? cores.perigo : cores.borda }]}>
                <View style={styles.cabecalho}><Text style={[styles.nome, { color: cores.texto }]}>{conta.descricao}</Text><Status valor={conta.status} /></View>
                <Text style={[styles.meta, { color: cores.textoSecundario }]}>{conta.tipo === 'RECEBER' ? 'A receber' : 'A pagar'} · vence {data(conta.vencimento)}</Text>
                <Text style={[styles.valor, { color: cores.texto }]}>{moeda(conta.valorPago)} de {moeda(conta.valorOriginal)}</Text>
                {saldo > 0 ? <Text style={[styles.saldo, { color: cores.destaque }]}>Saldo: {moeda(saldo)}</Text> : null}
                {conta.agendamento ? <Text style={[styles.vinculo, { color: cores.textoSecundario }]}>Atendimento #{conta.agendamento.id} · {data(conta.agendamento.data)}</Text> : null}
                {podeGerenciar && aberta ? <View style={styles.acoes}><Acao texto="Dar baixa" acao={() => setContaBaixa(conta)} />
                    {Number(conta.valorPago) === 0 ? <Acao texto="Cancelar" acao={() => setContaCancelar(conta)} perigo /> : null}</View> : null}
            </View>
        })}
        {contaBaixa ? <FormularioBaixaConta conta={contaBaixa} formas={formasPagamento.filter((forma) => forma.ativa)} executando={executando}
            fechar={() => setContaBaixa(null)} salvar={async (dados) => { if (await baixar(contaBaixa.id, dados)) setContaBaixa(null) }} /> : null}
        <Confirmacao visivel={!!contaCancelar} titulo="Cancelar conta" mensagem={`Deseja cancelar “${contaCancelar?.descricao ?? ''}”? Esta ação só é permitida antes de qualquer pagamento.`}
            confirmarLabel={executando ? 'Cancelando...' : 'Cancelar conta'} onConfirmar={confirmarCancelamento} onCancelar={() => setContaCancelar(null)} />
    </View>

    function Filtro({ titulo, itens, atual, selecionar }: { titulo: string; itens: string[]; atual: string; selecionar: (item: string) => void }) {
        return <View style={styles.filtro}><Text style={[styles.filtroTitulo, { color: cores.textoSecundario }]}>{titulo}</Text><View style={styles.chips}>{itens.map((item) => <Pressable key={item}
            onPress={() => selecionar(item)} style={[styles.chip, { borderColor: cores.borda }, atual === item && { backgroundColor: cores.destaque, borderColor: cores.destaque }]}>
            <Text style={{ color: atual === item ? cores.destaqueTexto : cores.texto, fontSize: 11, fontWeight: '800' }}>{rotulo(item)}</Text></Pressable>)}</View></View>
    }

    function Acao({ texto, acao, perigo }: { texto: string; acao: () => void; perigo?: boolean }) {
        return <Pressable disabled={executando} onPress={acao} style={[styles.acao, { borderColor: perigo ? cores.perigo : cores.destaque }]}><Text style={{ color: perigo ? cores.perigo : cores.destaque, fontWeight: '800' }}>{texto}</Text></Pressable>
    }

    function Status({ valor }: { valor: StatusConta }) {
        const cor = valor === 'ATRASADO' || valor === 'CANCELADO' ? cores.perigo : valor === 'PAGO' ? cores.sucesso : cores.destaque
        return <View style={[styles.status, { borderColor: cor }]}><Text style={{ color: cor, fontSize: 10, fontWeight: '900' }}>{rotulo(valor)}</Text></View>
    }
}

const data = (valor: string) => {
    const [ano, mes, dia] = valor.slice(0, 10).split('-')
    return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor
}
const ROTULOS: Record<string, string> = { TODOS: 'Todos', RECEBER: 'A receber', PAGAR: 'A pagar', PENDENTE: 'Pendente', PARCIAL: 'Parcial', ATRASADO: 'Atrasado', PAGO: 'Pago', CANCELADO: 'Cancelado' }
const rotulo = (valor: string) => ROTULOS[valor] ?? valor

const styles = StyleSheet.create({
    container: { gap: 11 }, titulo: { fontSize: 20, fontWeight: '900' }, filtro: { gap: 6 }, filtroTitulo: { fontSize: 12, fontWeight: '800' }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8 }, cartao: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 5 },
    cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, nome: { flex: 1, fontSize: 16, fontWeight: '900' },
    status: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 }, meta: { fontSize: 13 }, valor: { marginTop: 5, fontSize: 16, fontWeight: '800' },
    saldo: { fontSize: 13, fontWeight: '800' }, vinculo: { marginTop: 4, fontSize: 12 }, acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
    acao: { minHeight: 40, justifyContent: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 13 },
})
