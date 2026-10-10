import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
    return (
        <Link href="/" className="flex items-center gap-3" aria-label="UniFlow ABS — página inicial">
            <Image
                src="/logo.png"
                alt="Emblema UniFlow ABS"
                width={88}
                height={88}
                className="h-16 w-16 shrink-0 object-contain sm:h-[88px] sm:w-[88px]"
                priority
            />
            <span className="flex flex-col leading-none">
                <span className="text-xl font-black tracking-tight text-zinc-100 sm:text-3xl">
                    Uni<span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">Flow</span>
                    <span className="ml-1 text-sm font-bold tracking-[0.28em] text-zinc-300 sm:text-base">ABS</span>
                </span>
                <span className="mt-2 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 sm:block">
                    Todos os serviços. Uma só plataforma.
                </span>
            </span>
        </Link>
    )
}
