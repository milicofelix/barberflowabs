import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ProvedorTema } from '@/data/contexts/ContextoTema'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'UniFlow ABS',
    description: 'Marketplace e gestão para serviços de beleza, estética e bem-estar.',
    icons: {
        icon: '/favicon.png',
        shortcut: '/favicon.png',
        apple: '/favicon.png',
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className={inter.className}>
                <ProvedorTema>{children}</ProvedorTema>
            </body>
        </html>
    )
}
