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
        <article className="flex min-w-0 rounded-xl border border-border bg-card text-foreground overflow-hidden">
            <Image
                src={servico.imagemURL}
                width={150}
                height={150}
                alt={servico.nome}
                className="aspect-video w-24 shrink-0 self-center bg-card object-contain sm:w-[120px]"
            />
            <div className="flex min-w-0 flex-1 flex-col p-4 gap-2">
                <h3 className="line-clamp-2 break-words text-lg font-bold">{servico.nome}</h3>
                {props.estabelecimento ? <Link href={`/estabelecimentos/${props.estabelecimento.slug}`} className="text-sm text-muted-foreground underline underline-offset-2">{props.estabelecimento.nome}</Link> : null}
                <p className="line-clamp-3 break-words text-sm text-muted-foreground">{servico.descricao}</p>
                <span className="text-lg font-bold">{servico.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
        </article>
    )
}
