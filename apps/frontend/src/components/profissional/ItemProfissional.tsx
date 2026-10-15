import { Profissional, urlImagemProfissional } from '@uniflowabs/core'
import Link from 'next/link'
import Image from 'next/image'
import Avaliacao from '../shared/Avaliacao'

export interface ItemProfissionalProps {
    profissional: Profissional
    estabelecimento?: { nome: string; slug: string }
}

export default function ItemProfissional(props: ItemProfissionalProps) {
    const { profissional } = props
    return (
        <article className="flex min-w-0 flex-col rounded-xl border border-border bg-card text-foreground overflow-hidden">
            <div className="relative h-72 w-full bg-card">
                <Image
                    src={urlImagemProfissional(profissional.imagemURL, profissional.sexo)}
                    fill
                    alt={profissional.nome}
                    className="object-contain object-center"
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                />
            </div>
            <div className="flex flex-col p-4 gap-3">
                <h3 className="line-clamp-2 break-words text-lg font-bold">{profissional.nome}</h3>
                {props.estabelecimento ? <Link href={`/estabelecimentos/${props.estabelecimento.slug}`} className="text-sm text-muted-foreground underline underline-offset-2">{props.estabelecimento.nome}</Link> : null}
                <p className="line-clamp-2 break-words text-sm text-muted-foreground">{profissional.descricao}</p>

                <Avaliacao
                    nota={profissional.avaliacao}
                    quantidade={profissional.quantidadeAvaliacoes}
                />

            </div>
        </article>
    )
}
