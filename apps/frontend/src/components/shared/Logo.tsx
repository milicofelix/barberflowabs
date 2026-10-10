import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
    return (
        <Link href="/" className="logo-uniflow" aria-label="UniFlow ABS — página inicial">
            <Image
                src="/logo.png"
                alt="Emblema UniFlow ABS"
                width={88}
                height={88}
                className="h-16 w-16 shrink-0 object-contain sm:h-[88px] sm:w-[88px]"
                priority
            />
            <span className="logo-conteudo">
                <span className="brand">
                    <span className="brand-name">
                        Uni<span className="brand-flow">Flow</span>
                    </span>
                    <span className="brand-abs">ABS</span>
                </span>
                <span className="brand-tagline">
                    Todos os serviços. Uma só plataforma.
                </span>
            </span>
        </Link>
    )
}
