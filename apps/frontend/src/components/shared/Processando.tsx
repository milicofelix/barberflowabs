import Image from 'next/image'
import Logo from './Logo'

export default function Processando() {
    return (
        <div className="h-screen">
            <Image src="/banners/principal.webp" fill alt="Banner" />
            <div
                className="
                    flex flex-col justify-center items-center
                    absolute top-0 left-0 w-full h-full gap-2
                    bg-black/90 text-center
                "
            >
                <Logo />
                <span className="font-light text-zinc-500 ml-3">Processando...</span>
            </div>
        </div>
    )
}
