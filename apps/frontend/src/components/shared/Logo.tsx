import Image from 'next/image'
import Link from 'next/link'

export default function Logo() {
    return (
        <Link href="/" className="flex items-center pt-4">
            <Image src="/logo.png" alt="Logo" width={250} height={250} className="hidden sm:block" priority />
            <Image src="/logo.png" alt="Logo" width={50} height={50} className="block sm:hidden" priority />
        </Link>
    )
}
