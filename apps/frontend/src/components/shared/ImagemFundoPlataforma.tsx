'use client'

import Image from 'next/image'
import useTema from '@/data/contexts/ContextoTema'
import { fundoDaPlataforma } from '@/data/estabelecimentos/capas'

export default function ImagemFundoPlataforma() {
    const { tema } = useTema()
    return <Image src={fundoDaPlataforma(tema)} fill alt="" className="object-cover" />
}
