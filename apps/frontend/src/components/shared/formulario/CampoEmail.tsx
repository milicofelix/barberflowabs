export interface CampoEmailProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onChangeText?: (s: string) => void
}

export default function CampoEmail(props: CampoEmailProps) {
    return (
        <input
            type="email"
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
