import { ProvedorSessao } from '../../data/contexts/ContextoSessao'
import SeparacaoPerfilPlataforma from '@/components/shared/SeparacaoPerfilPlataforma'

export default function Layout(props: any) {
    return <ProvedorSessao><SeparacaoPerfilPlataforma>{props.children}</SeparacaoPerfilPlataforma></ProvedorSessao>
}
