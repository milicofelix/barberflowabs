import Link from 'next/link'
import { CalendarDays, Flower2, Hand, Scissors, Settings, ShieldCheck, Sparkles, TrendingUp, UsersRound } from 'lucide-react'
import { IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin, IconBrandWhatsapp, IconBrandYoutube } from '@tabler/icons-react'
import Logo from './Logo'

const segmentos = [
    { nome: 'Barbearia', descricao: 'Cabelo e barba', icone: Scissors, cor: 'icone-azul' },
    { nome: 'Salão de beleza', descricao: 'Cabelos e tratamentos', icone: Sparkles, cor: 'icone-violeta' },
    { nome: 'Unhas', descricao: 'Manicure e pedicure', icone: Hand, cor: 'icone-rosa' },
    { nome: 'Estética', descricao: 'Facial e corporal', icone: Flower2, cor: 'icone-turquesa' },
]

const beneficios = [
    { nome: 'Agendamentos', descricao: 'Sem complicação', icone: CalendarDays },
    { nome: 'Gestão', descricao: 'Mais organização', icone: Settings },
    { nome: 'Crescimento', descricao: 'Mais resultados', icone: TrendingUp },
    { nome: 'Clientes', descricao: 'Mais satisfeitos', icone: UsersRound },
    { nome: 'Para todos', descricao: 'Todos os segmentos', icone: ShieldCheck },
]

export default function Rodape() {
    return (
        <footer className="rodape-uniflow">
            <div className="container py-10">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {segmentos.map(({ nome, descricao, icone: Icone, cor }) => (
                        <div key={nome} className="segmento-rodape">
                            <span className={`icone-segmento ${cor}`}><Icone size={25} strokeWidth={1.8} /></span>
                            <span><strong>{nome}</strong><small>{descricao}</small></span>
                        </div>
                    ))}
                </div>

                <div className="my-8 grid gap-3 border-y border-current/10 py-6 sm:grid-cols-2 lg:grid-cols-5">
                    {beneficios.map(({ nome, descricao, icone: Icone }) => (
                        <div key={nome} className="beneficio-rodape">
                            <Icone size={25} strokeWidth={1.8} />
                            <span><strong>{nome}</strong><small>{descricao}</small></span>
                        </div>
                    ))}
                </div>

                <div className="grid items-start gap-8 md:grid-cols-[1.2fr_.7fr_.8fr]">
                    <Logo />
                    <div className="grid gap-2 text-sm">
                        <strong className="text-lg">Sobre</strong>
                        <Link href="/">Nossa história</Link>
                        <Link href="/estabelecimentos">Estabelecimentos</Link>
                        <span>Política de Privacidade</span>
                        <span>Termos de Uso</span>
                    </div>
                    <div className="grid gap-2 text-sm">
                        <strong className="text-lg">Contato</strong>
                        <span>suporte@barberflowabs.app</span>
                        <span className="flex items-center gap-2"><IconBrandWhatsapp size={20} className="text-emerald-500" />WhatsApp</span>
                    </div>
                </div>

                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-current/10 pt-6 text-sm md:flex-row">
                    <div className="flex gap-3">
                        <IconBrandYoutube size={24} stroke={1.4} />
                        <IconBrandInstagram size={24} stroke={1.4} />
                        <IconBrandFacebook size={24} stroke={1.4} />
                        <IconBrandLinkedin size={24} stroke={1.4} />
                    </div>
                    <span>UniFlow ABS © {new Date().getFullYear()} — Todos os direitos reservados</span>
                </div>
            </div>
        </footer>
    )
}
