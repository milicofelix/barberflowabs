export interface TituloSecaoProps {
    tag?: string
    principal: string
    secundario: string
}

export default function TituloSecao(props: TituloSecaoProps) {
    return (
        <div className="flex flex-col items-center">
            {props.tag && (
                <div className="bg-zinc-700 px-4 py-1.5 rounded-md text-sm md:text-base font-black mb-2">
                    {props.tag}
                </div>
            )}
            <h2 className="text-2xl sm:text-4x md:text-5xl font-bold text-gradient">
                {props.principal}
            </h2>
            <h3 className="text-zinc-500 md:w-[450px] px-7 md:px-0 text-center">
                {props.secundario}
            </h3>
        </div>
    )
}
