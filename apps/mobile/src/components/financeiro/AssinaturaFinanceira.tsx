import Confirmacao from '@/src/components/shared/Confirmacao'
import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useTema from '@/src/data/contexts/ContextoTema'
import { data, moeda } from '@/src/data/financeiro/formatacao'
import type { AssinaturaEstabelecimento, CobrancaAssinatura } from '@/src/data/financeiro/tipos'
import { useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'

interface Props {
    assinatura: AssinaturaEstabelecimento | null
    podeGerenciar: boolean
    executando: boolean
    gerarCobranca: () => Promise<boolean>
}

const STATUS_ASSINATURA = {
    TRIAL: 'Período de avaliação', ACTIVE: 'Ativa', PAST_DUE: 'Pagamento atrasado', CANCELED: 'Cancelada',
} as const

const STATUS_COBRANCA = {
    PENDENTE: 'Pendente', PAGO: 'Pago', ATRASADA: 'Atrasada', FALHOU: 'Falhou', CANCELADA: 'Cancelada',
} as const

export default function AssinaturaFinanceira({ assinatura, podeGerenciar, executando, gerarCobranca }: Props) {
    const { cores } = useTema()
    const [confirmando, setConfirmando] = useState(false)

    async function confirmarGeracao() {
        if (executando) return
        if (await gerarCobranca()) setConfirmando(false)
    }

    if (!assinatura) return <EstadoVazio titulo="Nenhuma assinatura vinculada" />

    const inadimplente = assinatura.status === 'PAST_DUE'
    return <View style={styles.container}>
        {inadimplente ? <View style={[styles.alerta, { backgroundColor: `${cores.perigo}18`, borderColor: cores.perigo }]}>
            <Text style={[styles.alertaTitulo, { color: cores.perigo }]}>Assinatura com pagamento atrasado</Text>
            <Text style={{ color: cores.texto, lineHeight: 20 }}>Regularize uma cobrança em atraso. Enquanto o pagamento não for confirmado, recursos do estabelecimento podem permanecer bloqueados.</Text>
        </View> : null}

        <View style={[styles.resumo, { backgroundColor: cores.superficie, borderColor: cores.borda }]}>
            <View style={styles.linha}>
                <View style={styles.flexivel}><Text style={[styles.plano, { color: cores.texto }]}>{assinatura.plano.nome}</Text>
                    <Text style={[styles.meta, { color: cores.textoSecundario }]}>{moeda(assinatura.plano.precoMensal)} por mês</Text></View>
                <Status texto={STATUS_ASSINATURA[assinatura.status]} tom={inadimplente || assinatura.status === 'CANCELED' ? 'critico' : assinatura.status === 'TRIAL' ? 'atencao' : 'sucesso'} />
            </View>
            {assinatura.trialEndsAt ? <Text style={[styles.meta, { color: cores.textoSecundario }]}>Avaliação até {data(assinatura.trialEndsAt)}</Text> : null}
            {assinatura.currentPeriodEnd ? <Text style={[styles.meta, { color: cores.textoSecundario }]}>Período atual até {data(assinatura.currentPeriodEnd)}</Text> : null}
            {assinatura.cancelAtPeriodEnd ? <Text style={[styles.cancelamento, { color: cores.perigo }]}>Cancelamento programado para o final do período.</Text> : null}
            {podeGerenciar ? <Pressable disabled={executando} onPress={() => setConfirmando(true)}
                style={[styles.botao, { backgroundColor: cores.destaque }, executando && styles.desabilitado]}>
                <Text style={{ color: cores.destaqueTexto, fontWeight: '900' }}>{executando ? 'Processando...' : 'Gerar cobrança pendente'}</Text>
            </Pressable> : null}
        </View>

        <Text style={[styles.titulo, { color: cores.texto }]}>Histórico de cobranças</Text>
        {!assinatura.cobrancas.length ? <EstadoVazio titulo="Nenhuma cobrança encontrada" /> : assinatura.cobrancas.map((item) => <Cobranca key={item.id} item={item} />)}

        <Confirmacao visivel={confirmando} titulo="Gerar cobrança" mensagem="Uma cobrança pendente será criada ou a cobrança pendente atual será reapresentada. Deseja continuar?"
            confirmarLabel={executando ? 'Gerando...' : 'Gerar cobrança'} onConfirmar={confirmarGeracao} onCancelar={() => setConfirmando(false)} />
    </View>
}

function Cobranca({ item }: { item: CobrancaAssinatura }) {
    const { cores } = useTema()
    const critico = item.status === 'ATRASADA' || item.status === 'FALHOU'
    const abrirPagamento = () => item.linkPagamento && Linking.openURL(item.linkPagamento)
    return <View style={[styles.cobranca, { backgroundColor: cores.superficie, borderColor: critico ? cores.perigo : cores.borda }]}>
        <View style={styles.linha}><Text style={[styles.valor, { color: cores.texto }]}>{moeda(item.valor)}</Text><Status texto={STATUS_COBRANCA[item.status]} tom={critico || item.status === 'CANCELADA' ? 'critico' : item.status === 'PENDENTE' ? 'atencao' : 'sucesso'} /></View>
        <Text style={[styles.meta, { color: cores.textoSecundario }]}>Vencimento {data(item.vencimento)} · {item.provedor}</Text>
        {item.pagoEm ? <Text style={[styles.meta, { color: cores.sucesso }]}>Pagamento confirmado em {data(item.pagoEm)}</Text> : null}
        {item.codigoPix ? <View style={[styles.pix, { backgroundColor: cores.superficieElevada }]}><Text style={{ color: cores.textoSecundario, fontSize: 12 }}>Código PIX</Text><Text selectable style={{ color: cores.texto, fontSize: 12 }}>{item.codigoPix}</Text></View> : null}
        {item.linkPagamento ? <Pressable onPress={abrirPagamento} style={[styles.link, { borderColor: cores.destaque }]}><Text style={{ color: cores.destaque, fontWeight: '800' }}>Abrir pagamento</Text></Pressable> : null}
    </View>
}

function Status({ texto, tom }: { texto: string; tom: 'sucesso' | 'atencao' | 'critico' }) {
    const { cores } = useTema()
    const cor = tom === 'critico' ? cores.perigo : tom === 'atencao' ? cores.destaque : cores.sucesso
    return <View style={[styles.status, { backgroundColor: `${cor}18` }]}><Text style={{ color: cor, fontSize: 11, fontWeight: '900' }}>{texto.toUpperCase()}</Text></View>
}

const styles = StyleSheet.create({
    container: { gap: 11 }, alerta: { borderWidth: 1, borderRadius: 13, padding: 14, gap: 6 }, alertaTitulo: { fontSize: 16, fontWeight: '900' },
    resumo: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 7 }, linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
    flexivel: { flex: 1 }, plano: { fontSize: 19, fontWeight: '900' }, meta: { fontSize: 12, lineHeight: 18 }, cancelamento: { fontSize: 12, fontWeight: '800' },
    status: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 }, botao: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 11, marginTop: 5 },
    desabilitado: { opacity: 0.5 }, titulo: { fontSize: 18, fontWeight: '900', marginTop: 4 }, cobranca: { borderWidth: 1, borderRadius: 13, padding: 14, gap: 6 },
    valor: { fontSize: 17, fontWeight: '900' }, pix: { borderRadius: 9, padding: 10, gap: 4 }, link: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
})
