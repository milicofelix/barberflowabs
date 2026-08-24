import { Servico } from '@barbabrutal/core'
import useServicos from '@/data/hooks/useServicos'
import Image from 'next/image'

export interface CampoServicosProps
    extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
    label?: string
    value: Servico[]
    onChange: (value: Servico[]) => void
}

function Opcao(props: {
    servico: Servico
    servicoMudou: (s: Servico) => void
    selecionado: boolean
}) {
    return (
        <button
            className={`
                flex flex-col items-center border rounded overflow-hidden select-none
                ${props.selecionado ? 'border-green-400' : 'border-zinc-700'}
            `}
            onClick={() => props.servicoMudou(props.servico)}
        >
            <Image
                src={props.servico.imagemURL}
                height={150}
                width={150}
                alt={props.servico.nome}
            />
            <div
                className={`
                    py-2 w-full text-sm text-center
                    ${props.selecionado ? 'bg-green-400 text-black font-semibold' : 'bg-zinc-700 text-zinc-400'}
                `}
            >
                {props.servico.nome}
            </div>
        </button>
    )
}

export default function CampoServicos(props: CampoServicosProps) {
    const { servicos } = useServicos()

    function alternarMarcacao(servico: Servico) {
        const marcado = props.value.some((s) => s.id === servico.id)
        if (marcado) {
            props.onChange(props.value.filter((s) => s.id !== servico.id))
        } else {
            props.onChange([...props.value, servico])
        }
    }

    return servicos ? (
        <div className="flex flex-col gap-5">
            {props.label && <span className="text-sm uppercase text-zinc-400">{props.label}</span>}
            <div className="grid grid-cols-3 gap-7 self-start">
                {servicos.map((servico) => {
                    return (
                        <Opcao
                            key={servico.id}
                            servico={servico}
                            servicoMudou={alternarMarcacao}
                            selecionado={props.value.some((s) => s.id === servico.id)}
                        />
                    )
                })}
            </div>
        </div>
    ) : null
}
