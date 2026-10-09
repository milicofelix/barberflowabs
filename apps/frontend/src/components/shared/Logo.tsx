import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
    return (
        <Link href="/" className="flex items-center">
            <Image
                src="/logo.png"
                alt="Logo UniFlow ABS"
                width={250}
                height={189}
                className="hidden h-auto w-[250px] object-contain sm:block"
                priority
            />
            <Image
                src="/logo.png"
                alt="Logo UniFlow ABS"
                width={80}
                height={60}
                className="block h-auto w-20 object-contain sm:hidden"
                priority
            />
        </Link>
    )
}
