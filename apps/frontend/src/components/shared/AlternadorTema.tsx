'use client'

import { Moon, Sun } from 'lucide-react'
import useTema from '@/data/contexts/ContextoTema'

export default function AlternadorTema() {
    const { tema, alternarTema } = useTema()
    const escuro = tema === 'dark'

    return (
        <button
            type="button"
            onClick={alternarTema}
            className="alternador-tema"
            aria-label={escuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
            title={escuro ? 'Tema claro' : 'Tema escuro'}
        >
            {escuro ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
        </button>
    )
}
