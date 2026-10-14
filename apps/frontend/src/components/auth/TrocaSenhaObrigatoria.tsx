'use client'

import { useState, type FormEvent } from 'react'
import useSessao from '@/data/hooks/useSessao'

export default function TrocaSenhaObrigatoria() {
    const { token, iniciarSessao, encerrarSessao } = useSessao()
    const [atual, setAtual] = useState(''); const [nova, setNova] = useState(''); const [confirmacao, setConfirmacao] = useState('')
    const [erro, setErro] = useState(''); const [salvando, setSalvando] = useState(false)
    async function salvar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault()
        if (salvando) return
        if (nova !== confirmacao) { setErro('As senhas não coincidem.'); return }
        if (nova === atual) { setErro('Escolha uma senha diferente da temporária.'); return }
        setSalvando(true); setErro('')
        try {
            const resposta = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/alterar-senha`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ senhaAtual: atual, novaSenha: nova }),
            })
            if (!resposta.ok) {
                const dados = await resposta.json().catch(() => ({}))
                throw new Error(dados.message ?? 'Não foi possível alterar a senha.')
            }
            iniciarSessao(await resposta.text())
        } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível conectar ao servidor.') }
        finally { setSalvando(false) }
    }
    return <main className="min-h-screen flex items-center justify-center p-6">
        <form onSubmit={salvar} className="w-full max-w-md flex flex-col gap-5 rounded-2xl border p-6">
            <h1 className="text-2xl font-bold">Crie sua senha de acesso</h1>
            <p>Substitua a senha temporária fornecida pelo estabelecimento para continuar.</p>
            <label className="flex flex-col gap-2">Senha temporária<input className="border rounded-lg p-3 bg-transparent" type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} minLength={6} required disabled={salvando} /></label>
            <label className="flex flex-col gap-2">Nova senha (mínimo 6 caracteres)<input className="border rounded-lg p-3 bg-transparent" type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} minLength={6} maxLength={72} required disabled={salvando} /></label>
            <label className="flex flex-col gap-2">Confirme a nova senha<input className="border rounded-lg p-3 bg-transparent" type="password" autoComplete="new-password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} minLength={6} maxLength={72} required disabled={salvando} /></label>
            {erro ? <p role="alert" className="text-red-600">{erro}</p> : null}
            <button className="bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar senha e continuar'}</button>
            <button type="button" disabled={salvando} onClick={encerrarSessao}>Sair</button>
        </form>
    </main>
}
