import ConfirmarDescadastro from './ConfirmarDescadastro'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Preferências de campanhas', referrer: 'no-referrer', robots: { index: false, follow: false } }
export default function DescadastroPage({ searchParams }: { searchParams: { token?: string } }) {
    return <ConfirmarDescadastro token={typeof searchParams.token === 'string' ? searchParams.token : ''} />
}
