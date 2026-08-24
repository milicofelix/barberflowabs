export interface CampoTelefoneProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onChangeText?: (s: string) => void
}

export default function CampoTelefone(props: CampoTelefoneProps) {
    return (
        <input
            type="tel"
            value={props.value}
            onChange={(e) => {
                props.onChange?.(e)
                props.onChangeText?.(e.target.value)
            }}
            placeholder={props.placeholder}
            className="input"
        />
    )
}
