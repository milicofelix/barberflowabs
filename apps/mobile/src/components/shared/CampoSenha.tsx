import CampoTexto, { CampoTextoProps } from './CampoTexto'

export default function CampoSenha(props: CampoTextoProps) {
    return <CampoTexto {...props} secureTextEntry={true} />
}
