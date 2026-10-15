'use client'

import { useEffect, useRef } from 'react'

/** Contém o foco no diálogo superior, incluindo quando um editor abre sobre o detalhe. */
export default function useDialogoCentral(fechar: () => void, ocupado: boolean) {
    const ref = useRef<HTMLElement>(null)
    const atual = useRef({ fechar, ocupado }); atual.current = { fechar, ocupado }
    useEffect(() => {
        const anterior = document.activeElement as HTMLElement | null
        const dialogo = ref.current
        if (!dialogo) return
        const elementos = () => Array.from(dialogo.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'))
        elementos()[0]?.focus()
        function teclado(evento: KeyboardEvent) {
            const dialogos = document.querySelectorAll('[data-dialogo-central]')
            if (dialogos[dialogos.length - 1] !== dialogo) return
            if (evento.key === 'Escape') { evento.preventDefault(); if (!atual.current.ocupado) atual.current.fechar() }
            if (evento.key !== 'Tab') return
            const itens = elementos(); const primeiro = itens[0]; const ultimo = itens[itens.length - 1]
            if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo?.focus() }
            else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro?.focus() }
        }
        document.addEventListener('keydown', teclado)
        return () => { document.removeEventListener('keydown', teclado); if (anterior?.isConnected) anterior.focus() }
    }, [])
    return ref
}
