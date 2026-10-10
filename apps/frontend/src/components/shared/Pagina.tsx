import Rodape from './Rodape'

export interface PaginaProps {
    children: any
    className?: string
}

export default function Pagina(props: PaginaProps) {
    return (
        <div
            className="pagina-tema relative flex min-h-screen w-screen flex-col bg-zinc-950 bg-cover bg-center bg-fixed text-zinc-100"
            style={{ backgroundImage: 'url(/banners/principal.png)' }}
        >
            <div className="pagina-tema-overlay pointer-events-none absolute inset-0 z-0 bg-black/80" />
            <main className={['relative z-10', props.className ?? ''].join(' ')}>{props.children}</main>
            <div className="relative z-10">
                <Rodape />
            </div>
        </div>
    )
}
