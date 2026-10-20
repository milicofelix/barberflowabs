'use client'

import Image from 'next/image'
import Link from 'next/link'
import useIdentidadeUnidade from '@/data/hooks/useIdentidadeUnidade'
import { resolverURLMidia, type IdentidadeEstabelecimento } from '@uniflowabs/core'
import { useEffect, useState } from 'react'

export default function Logo({ unidade: informada }: { unidade?: IdentidadeEstabelecimento & { nome?: string | null; nomePublico?: string | null } } = {}) {
    const { unidade, operacional } = useIdentidadeUnidade()
    const identidade = informada ?? unidade
    const [falhou, setFalhou] = useState(false)
    useEffect(() => setFalhou(false), [identidade?.logoURL])
    if (!informada && operacional && !unidade) return null
    if (identidade?.logoModo === 'OCULTO') return null
    if (identidade?.logoModo === 'PERSONALIZADO' && identidade.logoURL) {
        const nome = identidade.nomePublico || identidade.nome || 'Estabelecimento'
        return <Link href="/" aria-label={`${nome} — página inicial`} className="block max-w-[45vw] shrink-0">
            {falhou ? <span>{nome}</span> : <img src={resolverURLMidia(identidade.logoURL, process.env.NEXT_PUBLIC_API_URL ?? '')} alt={`Logo ${nome}`} onError={() => setFalhou(true)} className="h-16 w-auto max-w-[240px] object-contain sm:h-[88px] max-sm:max-w-[40vw]" />}
        </Link>
    }
    return (
        <Link href="/" className="logo-uniflow" aria-label="UniFlow ABS — página inicial">
            <Image
                src="/logo.png"
                alt="Emblema UniFlow ABS"
                width={88}
                height={88}
                className="h-16 w-16 shrink-0 object-contain sm:h-[88px] sm:w-[88px]"
                priority
            />
            <span className="logo-conteudo">
                <span className="brand">
                    <span className="brand-name">
                        Uni<span className="brand-flow">Flow</span>
                    </span>
                    <span className="brand-abs">ABS</span>
                </span>
                <span className="brand-tagline">
                    Todos os serviços. Uma só plataforma.
                </span>
            </span>
        </Link>
    )
}
