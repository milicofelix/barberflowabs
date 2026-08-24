import CampoTexto, { CampoTextoProps } from './CampoTexto'

export default function CampoEmail(props: CampoTextoProps) {
    return <CampoTexto {...props} keyboardType="email-address" />
}
