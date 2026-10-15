import type { Usuario } from '@uniflowabs/core'
import { CalendarDays, CreditCard, Home, LayoutDashboard, MapPin, Settings, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react'

export interface ItemMenu { href: string; titulo: string; descricao: string; icone: LucideIcon }

/** Destinos por perfil; a autorização continua nas páginas e APIs existentes. */
export function itensMenu(usuario?: Usuario | null): ItemMenu[] {
    if (!usuario) return []
    const papel = String(usuario.role ?? usuario.papel ?? '').toUpperCase()
    const admin = ['SUPER_ADMIN', 'APP_OWNER'].includes(papel)
    const operacional = !admin && Boolean(usuario.estabelecimentoId)
        && (Boolean(usuario.membroEstabelecimento) || ['ESTABLISHMENT_OWNER', 'ESTABLISHMENT_MEMBER'].includes(papel))
    if (admin) return [
        { href: '/admin', titulo: 'Admin SaaS', descricao: 'Administrar a plataforma', icone: ShieldCheck },
        { href: '/configuracoes', titulo: 'Configurações', descricao: 'Preferências da conta', icone: Settings },
    ]
    if (operacional) return [
        { href: '/', titulo: 'Início', descricao: 'Próximos atendimentos', icone: Home },
        { href: '/gestao', titulo: 'Gestão', descricao: 'Agenda, serviços e equipe', icone: LayoutDashboard },
        { href: '/financeiro', titulo: 'Financeiro', descricao: 'Caixa, contas e repasses', icone: Wallet },
        { href: '/configuracoes', titulo: 'Configurações', descricao: 'Identidade e operação', icone: Settings },
        { href: '/cobranca', titulo: 'Cobrança', descricao: 'Assinatura da unidade', icone: CreditCard },
    ]
    return [
        { href: '/', titulo: 'Início', descricao: 'Sua página inicial', icone: Home },
        { href: '/estabelecimentos', titulo: 'Estabelecimentos', descricao: 'Encontre seu atendimento', icone: MapPin },
        { href: '/agendamento', titulo: 'Meus horários', descricao: 'Acompanhe seus agendamentos', icone: CalendarDays },
        { href: '/configuracoes', titulo: 'Configurações', descricao: 'Preferências da conta', icone: Settings },
    ]
}
