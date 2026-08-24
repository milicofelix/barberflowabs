import Image from 'next/image'
import Cabecalho from './Cabecalho'

interface CabecalhoComTituloProps {
    titulo: string
    descricao: string
}

export default function CabecalhoComTitulo(props: CabecalhoComTituloProps) {
    return (
        <div className="relative h-[180px]">
            <Image src="/banners/principal.webp" fill alt="Barbearia" className="object-cover" />
            <div
                className="
                    flex flex-col
                    absolute top-0 left-0 w-full h-full
                    bg-black/70
                "
            >
                <Cabecalho />
                <div className="container flex flex-col justify-center items-center">
                    <h1 className="text-3xl font-bold text-zinc-200">{props.titulo}</h1>
                    <p className="text-xs font-light text-zinc-400">{props.descricao}</p>
                </div>
            </div>
        </div>
    )
}
