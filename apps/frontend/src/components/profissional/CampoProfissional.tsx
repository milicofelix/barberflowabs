import useProfissionais from '@/data/hooks/useProfissionais'
import { Profissional } from '@barbabrutal/core'
import Image from 'next/image'

export interface CampoProfissionalProps
    extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
    label?: string
    value: Profissional | null
    onChange: (value: Profissional | null) => void
}

function Opcao(props: {
    profissional: Profissional
    profissionalMudou: (p: Profissional) => void
    selecionado: boolean
}) {
    return (
        <button
            className={`
                flex flex-col items-center border rounded overflow-hidden select-none
                ${props.selecionado ? 'border-green-400' : 'border-zinc-700'}
            `}
            onClick={() => props.profissionalMudou(props.profissional)}
        >
            <Image
                src={props.profissional.imagemURL}
                height={150}
                width={150}
                alt={props.profissional.nome}
            />
            <div
                className={`
                    py-2 w-full text-sm text-center
                    ${props.selecionado ? 'bg-green-400 text-black font-semibold' : 'bg-zinc-700 text-zinc-400'}
                `}
            >
                {props.profissional.nome.split(' ')[0]}
            </div>
        </button>
    )
}

export default function CampoProfissional(props: CampoProfissionalProps) {
    const { profissionais } = useProfissionais()

    return profissionais ? (
        <div className="flex flex-col gap-5">
            {props.label && <span className="text-sm uppercase text-zinc-400">{props.label}</span>}
            <div className="grid grid-cols-3 self-start gap-5">
                {profissionais.map((profissional) => (
                    <Opcao
                        key={profissional.id}
                        profissional={profissional}
                        profissionalMudou={props.onChange}
                        selecionado={profissional.id === props.value?.id}
                    />
                ))}
            </div>
        </div>
    ) : null
}
