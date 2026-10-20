import Cabecalho from './Cabecalho'
import ImagemIdentidadeUnidade from './ImagemIdentidadeUnidade'
import NavegacaoEmBotoes from './NavegacaoEmBotoes'

interface CabecalhoComTituloProps {
    titulo: string
    descricao: string
}

export default function CabecalhoComTitulo(props: CabecalhoComTituloProps) {
    return (
        <div className="relative overflow-hidden">
            <ImagemIdentidadeUnidade alt="Identidade do estabelecimento" className="absolute inset-0 h-full w-full object-cover" />
            <div
                className="
                    sobre-imagem relative flex min-h-[390px] flex-col sm:min-h-[410px]
                    bg-black/65
                "
            >
                <Cabecalho />
                <div className="container flex flex-1 flex-col items-center justify-center py-5">
                    <h1 className="text-3xl font-bold text-zinc-200">{props.titulo}</h1>
                    <p className="text-xs font-light text-zinc-400">{props.descricao}</p>
                </div>
                <NavegacaoEmBotoes />
            </div>
        </div>
    )
}
