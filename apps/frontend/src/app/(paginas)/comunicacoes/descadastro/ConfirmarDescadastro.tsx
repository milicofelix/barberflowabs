'use client'
import { useState } from 'react'
import Link from 'next/link'
export default function ConfirmarDescadastro({ token }: { token: string }) {
    const [ocupado, setOcupado] = useState(false); const [concluido, setConcluido] = useState(false); const [erro, setErro] = useState('')
    async function confirmar() {
        if (ocupado || !token || concluido) return
        setOcupado(true); setErro('')
        try {
            const base = process.env.NEXT_PUBLIC_API_URL
            if (!base) throw new Error('API não configurada.')
            const resposta = await fetch(`${base}/public/comunicacoes/descadastro`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }), cache: 'no-store' })
            const dados = await resposta.json()
            if (!resposta.ok) throw new Error(dados.message || 'Não foi possível confirmar o descadastro.')
            setConcluido(true)
        } catch (e) { setErro(e instanceof Error ? e.message : 'Falha de conexão. Tente novamente.') }
        finally { setOcupado(false) }
    }
    return <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 p-6 text-foreground">
        <h1 className="text-2xl font-bold">Preferências de campanhas</h1>
        <p>{concluido ? 'Você deixou de receber campanhas deste estabelecimento neste canal.' : 'Confirme para deixar de receber campanhas do estabelecimento e canal indicados pelo link. Isso não cancela seus agendamentos.'}</p>
        {!token ? <p role="alert">Link inválido. Abra o link recebido na mensagem.</p> : !concluido ? <button type="button" disabled={ocupado} onClick={confirmar} className="min-h-11 rounded-lg border border-border px-4 py-3 font-bold disabled:opacity-50">{ocupado ? 'Confirmando…' : 'Confirmar descadastro'}</button> : null}
        {erro ? <p role="alert">{erro}</p> : null}
        <Link href="/" className="underline">Voltar ao início</Link>
    </main>
}
