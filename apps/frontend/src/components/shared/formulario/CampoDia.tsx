import { DateUtils } from '@barbabrutal/core'

export interface CampoDiaProps
    extends Omit<React.SelectHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    label?: string
    value: Date
    onChange: (value: Date) => void
}

export default function CampoDia(props: CampoDiaProps) {
    function renderizarDia(data: Date) {
        const selecionado = props.value.getDate() === data.getDate()
        return (
            <div
                key={data.getTime()}
                className={`
                    flex-1 flex flex-col items-center gap-2 py-4
                    ${selecionado ? 'bg-yellow-400 text-black' : 'text-zinc-300'}
                `}
                onClick={() => props.onChange(data)}
            >
                <div className="flex items-center gap-1">
                    <span className="text-2xl font-black">{data.getDate()}</span>
                    <span className="uppercase font-light text-xs">
                        {data.toLocaleDateString('pt-BR', { month: 'short' }).slice(0, 3)}
                    </span>
                </div>
                <div
                    className={`
                        uppercase text-xs font-light rounded-full py-0.5 px-3
                        ${selecionado ? 'bg-black/10 ' : 'bg-white/10'}
                    `}
                >
                    {data.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {props.label && (
                <span className="uppercase text-zinc-400 font-light">{props.label}</span>
            )}
            <div className="flex bg-zinc-800 rounded-lg  overflow-hidden">
                {DateUtils.proximosDias(7)
                    .filter((dia) => dia.getDay() !== 0)
                    .map((dia) => renderizarDia(dia))}
            </div>
        </div>
    )
}
