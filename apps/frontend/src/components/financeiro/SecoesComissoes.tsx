'use client'

import { useState } from 'react'
import { CampoFinanceiro, FormularioFinanceiro, LinhaFinanceira, ListaFinanceira, moeda } from './ComponentesFinanceiro'

export function ComissoesFinanceiras({ financeiro }: { financeiro: any }) {
    const [form, setForm] = useState({ profissionalId: '', servicoId: '', percentual: 40 })
    return <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <FormularioFinanceiro titulo="Configurar comissão" onSubmit={() => financeiro.salvarComissao({ profissionalId: form.profissionalId ? Number(form.profissionalId) : null, servicoId: form.servicoId ? Number(form.servicoId) : null, percentual: Number(form.percentual) })}>
            <CampoFinanceiro label="Profissional (opcional)" value={form.profissionalId} onChange={() => {}}><select className="input" value={form.profissionalId} onChange={(e) => setForm({ ...form, profissionalId: e.target.value })}><option value="">Todos</option>{financeiro.profissionais.map((item: any) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></CampoFinanceiro>
            <CampoFinanceiro label="Serviço (opcional)" value={form.servicoId} onChange={() => {}}><select className="input" value={form.servicoId} onChange={(e) => setForm({ ...form, servicoId: e.target.value })}><option value="">Todos</option>{financeiro.servicos.map((item: any) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></CampoFinanceiro>
            <CampoFinanceiro label="Percentual" type="number" value={form.percentual} onChange={(percentual) => setForm({ ...form, percentual: Number(percentual) })} />
        </FormularioFinanceiro>
        <ListaFinanceira titulo="Regras de comissão" vazio={!financeiro.comissoes.length}>{financeiro.comissoes.map((item: any) => <LinhaFinanceira key={item.id} titulo={item.profissional?.nome ?? item.servico?.nome ?? 'Comissão padrão'} detalhe={`${Number(item.percentual)}% · prioridade ${item.chave}`} status={item.ativo ? 'ATIVA' : 'INATIVA'} />)}</ListaFinanceira>
    </div>
}

export function RepassesFinanceiros({ financeiro }: { financeiro: any }) {
    return <div className="grid gap-4"><div><button type="button" className="button font-bold" onClick={financeiro.calcularRepasses}>Calcular repasses do período</button></div><ListaFinanceira titulo="Repasses" vazio={!financeiro.repasses.length}>{financeiro.repasses.map((item: any) => <LinhaFinanceira key={item.id} titulo={item.profissional?.nome ?? `Profissional #${item.profissionalId}`} detalhe={`Receita ${moeda(item.receitaBruta)} · comissão ${moeda(item.valorLiquido)} · ${Number(item.percentualMedio).toFixed(2)}%`} status={item.status} acao={item.status === 'PENDENTE' ? () => financeiro.pagarRepasse(item.id) : undefined} textoAcao="Marcar como pago" />)}</ListaFinanceira></div>
}
