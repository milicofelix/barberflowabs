import { Suspense } from 'react'
import AcaoAgendamentoCliente from './AcaoAgendamentoCliente'

export default function PaginaAcaoAgendamento() {
    return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-slate-50 text-slate-700">Carregando agendamento...</main>}><AcaoAgendamentoCliente /></Suspense>
}
