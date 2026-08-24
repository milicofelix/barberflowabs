import useSessao from '@/data/hooks/useSessao'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import Image from 'next/image'
import { IconCalendar, IconHome, IconLogout } from '@tabler/icons-react'
import Link from 'next/link'

export default function MenuUsuario() {
    const { usuario, encerrarSessao } = useSessao()

    return usuario ? (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="font-bold">{usuario.nome}</span>
                        <span className="text-zinc-400 text-xs">{usuario.email}</span>
                    </div>
                    <div className="bg-zinc-700 w-10 h-10 p-1 rounded-full">
                        <Image src="/avatar.png" width={40} height={40} alt="Avatar" />
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>
                    <Link href="/" className="flex gap-2">
                        <IconHome size={18} />
                        <span>Início</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Link href="/agendamento" className="flex gap-2">
                        <IconCalendar size={18} />
                        <span>Agendar</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={encerrarSessao} className="flex gap-2 text-red-500">
                    <IconLogout size={18} />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ) : null
}
