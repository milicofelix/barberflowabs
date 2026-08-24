import Rodape from './Rodape'

export interface PaginaProps {
    children: any
    className?: string
}

export default function Pagina(props: PaginaProps) {
    return (
        <div className="flex flex-col min-h-screen w-screen">
            <main className={props.className ?? ''}>{props.children}</main>
            <Rodape />
        </div>
    )
}
