import { clientes } from '@uniflowabs/core'
import { LayoutGrid } from '../ui/layout-grid'
import ItemCliente from './ItemCliente'
import TituloSecao from '../shared/TituloSecao'

export default function NossosClientes() {
    const classes = ['md:col-span-2', 'col-span-1', 'col-span-1', 'md:col-span-2']
    const cards = clientes.map((cliente, i) => {
        return {
            id: cliente.id,
            content: <ItemCliente nome={cliente.nome} testemunho={cliente.testemunho} />,
            thumbnail: cliente.imagemURL,
            className: classes[i],
        }
    })

    return (
        <div className="flex flex-col gap-y-16">
            <TituloSecao
                tag="Experiência"
                principal="Clientes Que Agendam Online"
                secundario="A plataforma aproxima clientes e estabelecimentos com busca por localização, agenda online e avaliações reais."
            />
            <div className="h-[900px] w-full">
                <LayoutGrid cards={cards} />
            </div>
        </div>
    )
}
