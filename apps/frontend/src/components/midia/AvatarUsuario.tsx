'use client'
import { useEffect, useState } from 'react'
import { urlImagemWeb } from './SeletorImagem'

export default function AvatarUsuario({ nome, fotoURL }: { nome: string; fotoURL?: string | null }) {
    const [falhou, setFalhou] = useState(false)
    useEffect(() => { setFalhou(false) }, [fotoURL])
    return fotoURL && !falhou ? <img src={urlImagemWeb(fotoURL)} alt={`Foto de ${nome}`} onError={() => setFalhou(true)} className="h-10 w-10 rounded-full object-cover" />
        : <span aria-label={`Perfil de ${nome}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white">{nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase()}</span>
}
