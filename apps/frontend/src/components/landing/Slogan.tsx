import Image from 'next/image'
import Cabecalho from '../shared/Cabecalho'
import Link from 'next/link'

export default function Slogan() {
    return (
        <div className="relative h-[450px] sm:h-[700px]">
            <Image src="/banners/principal.png" fill alt="Estabelecimento" className="object-cover" />
            <div
                className="
                    sobre-imagem flex flex-col items-center
                    absolute top-0 left-0 w-full h-full
                    bg-black/65
                "
            >
                <Cabecalho />
                <div className="flex flex-col justify-center items-center flex-1 gap-5">
                    <h1 className="flex flex-col items-center">
                        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-thin tracking-wider">
                            Encontre sua
                        </span>
                        <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-gradient">
                            Estabelecimento
                        </span>
                    </h1>
                    <p className="text-base sm:text-lg font-extralight">
                        Compare estabelecimentos, escolha um profissional e agende seu horário online.
                    </p>
                    <Link
                        href="/estabelecimentos"
                        className="
                            bg-gradient-to-r from-green-500 to-green-600
                            text-white font-semibold text-base md:text-lg
                            px-4 py-2 rounded-sm hover:from-green-600 hover:to-green-700 
                        "
                    >
                        Ver Estabelecimentos
                    </Link>
                </div>
            </div>
        </div>
    )
}
