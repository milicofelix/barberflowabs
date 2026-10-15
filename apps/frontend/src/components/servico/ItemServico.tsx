import { Servico } from '@uniflowabs/core'
import Image from 'next/image'
import Link from 'next/link'

export interface ItemServicoProps {
    servico: Servico
    estabelecimento?: { nome: string; slug: string }
}

export default function ItemServico(props: ItemServicoProps) {
    const { servico } = props
    return (
        <div className="flex rounded-xl bg-zinc-800 overflow-hidden">
            <Image
                src={servico.imagemURL}
                width={150}
                height={150}
                alt={servico.nome}
                className="aspect-video w-[150px] shrink-0 self-center bg-card object-contain"
            />
            <div className="flex flex-col p-5 gap-2">
                <span className="text-xl font-black">{servico.nome}</span>
                {props.estabelecimento ? <Link href={`/estabelecimentos/${props.estabelecimento.slug}`} className="text-sm text-muted-foreground underline underline-offset-2">{props.estabelecimento.nome}</Link> : null}
                <span className="text-xs text-zinc-400 flex-1">{servico.descricao}</span>
                <span className="text-lg font-bold">{servico.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
        </div>
    )
}
