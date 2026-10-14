import Rodape from './Rodape'
import ImagemIdentidadeUnidade from './ImagemIdentidadeUnidade'

export interface PaginaProps {
    children: any
    className?: string
}

export default function Pagina(props: PaginaProps) {
    return (
        <div
            className="pagina-tema relative flex min-h-screen w-screen flex-col bg-zinc-950 text-zinc-100"
        >
            <ImagemIdentidadeUnidade alt="" className="pointer-events-none fixed inset-0 h-full w-full object-cover" />
            <div className="pagina-tema-overlay pointer-events-none absolute inset-0 z-0 bg-black/80" />
            <main className={['relative z-10', props.className ?? ''].join(' ')}>{props.children}</main>
            <div className="relative z-10">
                <Rodape />
            </div>
        </div>
    )
}
