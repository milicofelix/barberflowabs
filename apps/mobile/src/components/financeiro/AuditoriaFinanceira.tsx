import EstadoVazio from '@/src/components/shared/EstadoVazio'
import useTema from '@/src/data/contexts/ContextoTema'
import { dataHora } from '@/src/data/financeiro/formatacao'
import type { EventoAuditoriaFinanceira } from '@/src/data/financeiro/tipos'
import { StyleSheet, Text, View } from 'react-native'

interface Props { eventos: EventoAuditoriaFinanceira[] }

export default function AuditoriaFinanceira({ eventos }: Props) {
    const { cores } = useTema()
    if (!eventos.length) return <EstadoVazio titulo="Nenhum evento financeiro auditado" />

    return <View style={styles.container}>{eventos.map((evento) => {
        const critico = CRITICOS.some((acao) => evento.acao.includes(acao))
        return <View key={evento.id} style={[styles.item, { backgroundColor: cores.superficie, borderColor: critico ? cores.perigo : cores.borda }]}>
            <View style={styles.linha}><Text style={[styles.acao, { color: critico ? cores.perigo : cores.texto }]}>{rotulo(evento.acao)}</Text>
                <Text style={[styles.data, { color: cores.textoSecundario }]}>{dataHora(evento.createdAt)}</Text></View>
            <Text style={[styles.meta, { color: cores.textoSecundario }]}>{evento.usuario?.nome ?? 'Sistema'} · {evento.entidade}{evento.entidadeId ? ` #${evento.entidadeId}` : ''}</Text>
            {evento.detalhes && Object.keys(evento.detalhes).length ? <Text style={[styles.detalhes, { color: cores.texto }]}>{detalhes(evento.detalhes)}</Text> : null}
        </View>
    })}</View>
}

const CRITICOS = ['CANCELED', 'PAST_DUE', 'DIVERGENT']
const ROTULOS: Record<string, string> = {
    FINANCIAL_ACCOUNT_CREATED: 'Conta criada', FINANCIAL_ACCOUNT_SETTLED: 'Conta baixada', FINANCIAL_ACCOUNT_CANCELED: 'Conta cancelada',
    FINANCIAL_APPOINTMENT_RECEIVABLE_CREATED: 'Recebível de atendimento criado', FINANCIAL_COMMISSION_SAVED: 'Comissão atualizada',
    FINANCIAL_CASH_REGISTER_OPENED: 'Caixa aberto', FINANCIAL_CASH_REGISTER_CLOSED: 'Caixa fechado',
    FINANCIAL_TRANSFERS_CALCULATED: 'Repasses calculados', FINANCIAL_TRANSFER_PAID: 'Repasse pago', FINANCIAL_PAYMENT_METHOD_SAVED: 'Forma de pagamento atualizada',
    FINANCIAL_RECONCILIATION_SAVED: 'Conciliação registrada', FINANCIAL_SUBSCRIPTION_CHARGE_CREATED: 'Cobrança de assinatura gerada',
    FINANCIAL_SUBSCRIPTION_PAST_DUE: 'Assinatura inadimplente',
}
const rotulo = (acao: string) => ROTULOS[acao] ?? acao.replace(/^FINANCIAL_/, '').replace(/_/g, ' ')
const detalhes = (valor: Record<string, unknown>) => Object.entries(valor).slice(0, 4).map(([chave, item]) => `${chave}: ${String(item ?? '-')}`).join(' · ')

const styles = StyleSheet.create({
    container: { gap: 9 }, item: { borderWidth: 1, borderRadius: 13, padding: 13, gap: 5 }, linha: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 9 },
    acao: { flex: 1, fontSize: 14, fontWeight: '900' }, data: { fontSize: 11 }, meta: { fontSize: 12 }, detalhes: { fontSize: 12, lineHeight: 18 },
})
