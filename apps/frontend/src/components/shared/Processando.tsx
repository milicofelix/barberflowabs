import ImagemFundoPlataforma from './ImagemFundoPlataforma'
import Logo from './Logo'

export default function Processando() {
    return (
        <div className="h-screen">
            <ImagemFundoPlataforma />
            <div
                className="
                    flex flex-col justify-center items-center
                    absolute top-0 left-0 w-full h-full gap-2
                    sobre-imagem bg-black/90 text-center
                "
            >
                <Logo />
                <span className="font-light text-zinc-500 ml-3">Processando...</span>
            </div>
        </div>
    )
}
