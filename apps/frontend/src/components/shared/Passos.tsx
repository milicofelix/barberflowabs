import { IconCheck, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { useState } from 'react'

export interface PassosProps {
    labels: string[]
    children: any
    permiteProximoPasso?: boolean[]
    labelAcao?: string
    acao?: () => void
}

export default function Passos(props: PassosProps) {
    const [passoAtual, setPassoAtual] = useState(0)

    function semPassoAnterior() {
        return passoAtual === 0
    }

    function passoAnterior() {
        if (semPassoAnterior()) return
        setPassoAtual(passoAtual - 1)
    }

    function semProximoPasso() {
        return passoAtual === props.labels.length - 1
    }

    function proximoPasso() {
        if (semProximoPasso()) return
        setPassoAtual(passoAtual + 1)
    }

    function renderizarLabels() {
        return (
            <div className="flex gap-4">
                {props.labels.map((label, i) => {
                    const selecionado = i === passoAtual
                    return (
                        <div key={i} className="flex items-center gap-2">
                            <span
                                className={`
                                    flex items-center justify-center
                                    w-9 h-9 rounded-full
                                ${selecionado ? 'bg-white text-black font-bold' : 'bg-zinc-700 text-zinc-400'}
                                `}
                            >
                                {i + 1}
                            </span>
                            <span className={selecionado ? 'text-white' : 'text-zinc-600'}>
                                {label}
                            </span>
                        </div>
                    )
                })}
            </div>
        )
    }

    const permiteProximoPasso = props.permiteProximoPasso?.[passoAtual] ?? true

    return (
        <div className="flex-1 flex flex-col gap-10">
            <div>{renderizarLabels()}</div>
            <div>{props.children[passoAtual] ?? props.children}</div>
            <div className="flex gap-3">
                <button
                    onClick={passoAnterior}
                    disabled={semPassoAnterior()}
                    className={`
                        flex gap-1 items-center button
                        ${semPassoAnterior() ? 'cursor-not-allowed opacity-50' : ''}    
                    `}
                >
                    <IconChevronLeft size={20} />
                    <span>Anterior</span>
                </button>
                {props.acao && semProximoPasso() ? (
                    <button
                        onClick={props.acao}
                        disabled={!permiteProximoPasso}
                        className={`
                            flex gap-1 items-center button bg-yellow-500 text-black
                            ${!permiteProximoPasso ? 'cursor-not-allowed opacity-50' : ''}
                        `}
                    >
                        <IconCheck size={20} />
                        <span>{props.labelAcao ?? 'Finalizar'}</span>
                    </button>
                ) : (
                    <button
                        onClick={proximoPasso}
                        disabled={semProximoPasso() || !permiteProximoPasso}
                        className={`
                            flex gap-1 items-center button
                            ${semProximoPasso() || !permiteProximoPasso ? 'cursor-not-allowed opacity-50' : ''}
                        `}
                    >
                        <IconChevronRight size={20} />
                        <span>Próximo</span>
                    </button>
                )}
            </div>
        </div>
    )
}
