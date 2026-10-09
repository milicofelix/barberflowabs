export function Campo(props: { label: string; value: string; type?: string; onChange: (valor: string) => void }) {
    return <label className="flex flex-col gap-2 text-sm text-zinc-400">{props.label}
        <input type={props.type ?? 'text'} value={props.value} onChange={(e) => props.onChange(e.target.value)} className="input" />
    </label>
}

export function Selecao(props: { label: string; value: string; opcoes: string[][]; onChange: (valor: string) => void }) {
    return <label className="flex flex-col gap-2 text-sm text-zinc-400">{props.label}
        <select value={props.value} onChange={(e) => props.onChange(e.target.value)} className="input">
            {props.opcoes.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
    </label>
}

export function GrupoOpcoes(props: {
    titulo: string
    itens: Array<{ id: number; nome: string }>
    selecionados: number[]
    alternar: (id: number) => void
}) {
    return <fieldset className="grid gap-2 rounded border border-zinc-800 p-4">
        <legend className="px-2 text-sm font-semibold text-zinc-300">{props.titulo}</legend>
        {props.itens.length ? <div className="flex flex-wrap gap-2">{props.itens.map((item) => {
            const ativo = props.selecionados.includes(item.id)
            return <button key={item.id} type="button" onClick={() => props.alternar(item.id)}
                className={['rounded-full border px-3 py-2 text-sm', ativo ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-zinc-700 text-zinc-300'].join(' ')}>
                {item.nome}
            </button>
        })}</div> : <p className="text-sm text-zinc-500">Selecione ao menos um segmento.</p>}
    </fieldset>
}
