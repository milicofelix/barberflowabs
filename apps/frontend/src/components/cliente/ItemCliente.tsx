export interface ItemClienteProps {
    nome: string
    testemunho: string
}

export default function ItemCliente(props: ItemClienteProps) {
    const { nome, testemunho } = props
    return (
        <div>
            <p className="font-bold text-4xl text-white">{nome}</p>
            <p className="my-4 text-zinc-300">{testemunho}</p>
        </div>
    )
}
