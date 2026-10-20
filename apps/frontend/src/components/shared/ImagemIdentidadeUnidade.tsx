'use client'

import { capaDoEstabelecimento } from '@/data/estabelecimentos/capas'
import useIdentidadeUnidade from '@/data/hooks/useIdentidadeUnidade'
import useTema from '@/data/contexts/ContextoTema'
import { useEffect, useState } from 'react'

export default function ImagemIdentidadeUnidade({ className = '', alt = '' }: { className?: string; alt?: string }) {
    const { unidade } = useIdentidadeUnidade()
    const { tema } = useTema()
    const [falhou, setFalhou] = useState(false)
    const imagem = capaDoEstabelecimento(unidade ?? {}, falhou, tema)
    useEffect(() => { setFalhou(false) }, [unidade?.imagemCapaURL, unidade?.tipoEstabelecimento])

    return <img src={imagem} alt={alt} decoding="async" onError={() => setFalhou(true)} className={className} />
}
