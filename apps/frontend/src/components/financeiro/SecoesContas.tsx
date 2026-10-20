'use client'

import { useState } from 'react'
import { CampoFinanceiro, FormularioFinanceiro, LinhaFinanceira, ListaFinanceira, data, moeda } from './ComponentesFinanceiro'

const hoje = () => new Date().toISOString().slice(0, 10)

export function ContasFinanceiras({ financeiro }: { financeiro: any }) {
    const [form, setForm] = useState({ tipo: 'RECEBER', descricao: '', categoria: '', valorOriginal: 0, competencia: hoje(), vencimento: hoje() })
    async function salvar() {
        if (await financeiro.criarConta({ ...form, valorOriginal: Number(form.valorOriginal) })) setForm({ ...form, descricao: '', categoria: '', valorOriginal: 0 })
    }
    return <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <FormularioFinanceiro titulo="Nova conta" onSubmit={salvar}>
            <CampoFinanceiro label="Tipo" value={form.tipo} onChange={() => {}}><select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}><option value="RECEBER">A receber</option><option value="PAGAR">A pagar</option></select></CampoFinanceiro>
            <CampoFinanceiro label="Descrição" value={form.descricao} onChange={(descricao) => setForm({ ...form, descricao })} />
            <CampoFinanceiro label="Categoria" value={form.categoria} onChange={(categoria) => setForm({ ...form, categoria })} />
            <CampoFinanceiro label="Valor" type="number" value={form.valorOriginal} onChange={(valorOriginal) => setForm({ ...form, valorOriginal: Number(valorOriginal) })} />
            <CampoFinanceiro label="Competência" type="date" value={form.competencia} onChange={(competencia) => setForm({ ...form, competencia })} />
            <CampoFinanceiro label="Vencimento" type="date" value={form.vencimento} onChange={(vencimento) => setForm({ ...form, vencimento })} />
        </FormularioFinanceiro>
        <ListaFinanceira titulo="Contas do período" vazio={!financeiro.contas.length}>{financeiro.contas.map((item: any) => <LinhaFinanceira key={item.id} titulo={`${item.tipo === 'PAGAR' ? 'A pagar' : 'A receber'} · ${item.descricao}`} detalhe={`${moeda(item.valorPago)} de ${moeda(item.valorOriginal)} · vence ${data(item.vencimento)}`} status={item.status} acao={!['PAGO', 'CANCELADO'].includes(item.status) ? () => financeiro.baixarConta(item.id, { valorPago: Number(item.valorOriginal) - Number(item.valorPago), pagoEm: new Date().toISOString(), formaPagamentoId: financeiro.formas.find((forma: any) => forma.ativa)?.id }) : undefined} textoAcao="Dar baixa" acaoSecundaria={Number(item.valorPago) === 0 && !['PAGO', 'CANCELADO'].includes(item.status) ? () => financeiro.cancelarConta(item.id) : undefined} textoAcaoSecundaria="Cancelar" />)}</ListaFinanceira>
    </div>
}

export function CaixaFinanceiro({ financeiro }: { financeiro: any }) {
    const aberto = financeiro.caixas.find((item: any) => item.status === 'ABERTO')
    const [saldo, setSaldo] = useState(0)
    const acao = aberto ? () => financeiro.fecharCaixa(aberto.id, { saldoInformado: Number(saldo) }) : () => financeiro.abrirCaixa({ saldoInicial: Number(saldo) })
    return <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <FormularioFinanceiro titulo={aberto ? 'Fechar caixa' : 'Abrir caixa'} onSubmit={acao}><CampoFinanceiro label={aberto ? 'Saldo contado' : 'Saldo inicial'} type="number" value={saldo} onChange={(valor) => setSaldo(Number(valor))} /></FormularioFinanceiro>
        <ListaFinanceira titulo="Histórico de caixa" vazio={!financeiro.caixas.length}>{financeiro.caixas.map((item: any) => <LinhaFinanceira key={item.id} titulo={`Caixa #${item.id} · ${item.status}`} detalhe={`Abertura ${data(item.abertoEm)} · esperado ${moeda(item.saldoEsperado)} · diferença ${moeda(item.diferenca)}`} />)}</ListaFinanceira>
    </div>
}
