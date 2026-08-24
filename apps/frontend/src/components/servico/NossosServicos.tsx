import ItemServico from './ItemServico'
import TituloSecao from '../shared/TituloSecao'
import useServicos from '../../data/hooks/useServicos'

export default function NossosServicos() {
    const { servicos } = useServicos()

    return (
        <div className="flex flex-col gap-y-16">
            <TituloSecao
                tag="Serviços"
                principal="Do Classico ao Rock"
                secundario="Cabelo afiado, barba de lenhador e mãos de motoqueiro, tudo ao som de rock pesado!"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {servicos.map((servico) => (
                    <ItemServico key={servico.id} servico={servico} />
                ))}
            </div>
        </div>
    )
}
