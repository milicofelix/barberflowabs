import Cabecalho from './Cabecalho'
import ImagemIdentidadeUnidade from './ImagemIdentidadeUnidade'

interface CabecalhoComTituloProps {
    titulo: string
    descricao: string
}

export default function CabecalhoComTitulo(props: CabecalhoComTituloProps) {
    return (
        <div className="relative h-[300px] overflow-hidden sm:h-[320px]">
            <ImagemIdentidadeUnidade alt="Identidade do estabelecimento" className="absolute inset-0 h-full w-full object-cover" />
            <div
                className="
                    sobre-imagem flex flex-col
                    absolute top-0 left-0 w-full h-full
                    bg-black/65
                "
            >
                <Cabecalho />
                <div className="container flex flex-1 flex-col items-center justify-center pb-10">
                    <h1 className="text-3xl font-bold text-zinc-200">{props.titulo}</h1>
                    <p className="text-xs font-light text-zinc-400">{props.descricao}</p>
                </div>
            </div>
        </div>
    )
}
