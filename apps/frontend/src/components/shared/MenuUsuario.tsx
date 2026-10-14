import useSessao from '@/data/hooks/useSessao'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import AvatarUsuario from '@/components/midia/AvatarUsuario'
import {
    IconCalendar,
    IconCreditCard,
    IconHome,
    IconLogout,
    IconSettings,
    IconShieldLock,
    IconTool,
    IconMapPin,
    IconCash,
} from '@tabler/icons-react'
import Link from 'next/link'

export default function MenuUsuario() {
    const { usuario, encerrarSessao } = useSessao()
    const superAdmin = usuario?.role === 'SUPER_ADMIN' || usuario?.papel === 'SUPER_ADMIN'
    const responsavelEstabelecimento = !!usuario?.membroEstabelecimento && !superAdmin
    const cliente = !usuario?.membroEstabelecimento && !superAdmin

    return usuario ? (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="font-bold">{usuario.nome}</span>
                        <span className="text-zinc-400 text-xs">{usuario.email}</span>
                    </div>
                    <AvatarUsuario nome={usuario.nome} fotoURL={usuario.fotoURL} />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {!superAdmin && (
                    <DropdownMenuItem>
                        <Link href="/" className="flex gap-2">
                            <IconHome size={18} />
                            <span>Início</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                {!superAdmin && (
                    <DropdownMenuItem>
                        <Link href="/estabelecimentos" className="flex gap-2">
                            <IconMapPin size={18} />
                            <span>Estabelecimentos</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                {cliente && (
                    <DropdownMenuItem>
                        <Link href="/agendamento" className="flex gap-2">
                            <IconCalendar size={18} />
                            <span>Meus horários</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                {responsavelEstabelecimento && (
                    <DropdownMenuItem>
                        <Link href="/financeiro" className="flex gap-2">
                            <IconCash size={18} />
                            <span>Financeiro</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                {responsavelEstabelecimento && (
                    <DropdownMenuItem>
                        <Link href="/gestao" className="flex gap-2">
                            <IconTool size={18} />
                            <span>Gestão</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                {usuario && (
                    <DropdownMenuItem>
                        <Link href="/configuracoes" className="flex gap-2">
                            <IconSettings size={18} />
                            <span>Configurações</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                {responsavelEstabelecimento && (
                    <DropdownMenuItem>
                        <Link href="/cobranca" className="flex gap-2">
                            <IconCreditCard size={18} />
                            <span>Cobrança</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                {superAdmin && (
                    <DropdownMenuItem>
                        <Link href="/admin" className="flex gap-2">
                            <IconShieldLock size={18} />
                            <span>Admin SaaS</span>
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={encerrarSessao} className="flex gap-2 text-red-500">
                    <IconLogout size={18} />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    ) : null
}
