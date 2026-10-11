'use client'

import { Moon, Sun } from 'lucide-react'
import useTema from '@/data/contexts/ContextoTema'

export default function AlternadorTema() {
    const { tema, automatico, alternarTema } = useTema()
    const escuro = tema === 'dark'

    return (
        <button
            type="button"
            onClick={alternarTema}
            className="alternador-tema"
            aria-label={automatico ? (escuro ? 'Usar tema claro manualmente' : 'Usar tema escuro manualmente') : 'Voltar ao tema automático'}
            title={automatico ? (escuro ? 'Tema automático · usar claro' : 'Tema automático · usar escuro') : 'Voltar ao tema automático'}
        >
            {escuro ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
            {automatico ? <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-black text-white">A</span> : null}
        </button>
    )
}
