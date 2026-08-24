import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { useState } from 'react'

export interface CampoSenhaProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onChangeText?: (s: string) => void
}

export default function CampoSenha(props: CampoSenhaProps) {
    const [mostrarSenha, setMostrarSenha] = useState(false)

    function alterarMostrarSenha() {
        setMostrarSenha(!mostrarSenha)
    }
    return (
        <div className="flex input">
            <input
                type={mostrarSenha ? 'text' : 'password'}
                value={props.value}
                onChange={(e) => {
                    props.onChange?.(e)
                    props.onChangeText?.(e.target.value)
                }}
                placeholder={props.placeholder}
                className="flex-1 bg-transparent outline-none"
            />
            {mostrarSenha ? (
                <IconEyeOff onClick={alterarMostrarSenha} className="text-zinc-400" />
            ) : (
                <IconEye onClick={alterarMostrarSenha} className="text-zinc-400" />
            )}
        </div>
    )
}
