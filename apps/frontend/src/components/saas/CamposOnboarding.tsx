interface CampoProps {
    label: string
    value: string
    type?: string
    placeholder?: string
    required?: boolean
    maxLength?: number
    onChange: (valor: string) => void
    onBlur?: () => void
}

export function Campo(props: CampoProps) {
    return <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
        <span>{props.label}{props.required && <span className="ml-1 text-violet-500">*</span>}</span>
        <input type={props.type ?? 'text'} value={props.value} placeholder={props.placeholder} required={props.required}
            maxLength={props.maxLength} onChange={(e) => props.onChange(e.target.value)} onBlur={props.onBlur} className="input min-h-11" />
    </label>
}

export function Selecao(props: { label: string; value: string; opcoes: string[][]; onChange: (valor: string) => void }) {
    return <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">{props.label}
        <select value={props.value} onChange={(e) => props.onChange(e.target.value)} className="input min-h-11">
            {props.opcoes.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
        </select>
    </label>
}

export function GrupoOpcoes(props: {
    titulo: string
    descricao?: string
    itens: Array<{ id: number; nome: string }>
    selecionados: number[]
    alternar: (id: number) => void
    mensagemSemOpcoes?: string
}) {
    return <fieldset className="grid gap-3 rounded-xl border border-border bg-background/60 p-4">
        <legend className="px-2 text-sm font-bold text-foreground">{props.titulo}</legend>
        {props.descricao && <p className="text-sm text-muted-foreground">{props.descricao}</p>}
        {props.itens.length ? <div className="flex flex-wrap gap-2">{props.itens.map((item) => {
            const ativo = props.selecionados.includes(item.id)
            return <button key={item.id} type="button" onClick={() => props.alternar(item.id)}
                className={['rounded-full border px-3 py-2 text-sm transition', ativo ? 'border-violet-500 bg-violet-600 text-white' : 'border-border bg-card text-foreground hover:border-violet-400'].join(' ')}>
                {item.nome}
            </button>
        })}</div> : <p className="text-sm text-muted-foreground">{props.mensagemSemOpcoes ?? 'Selecione ao menos um segmento.'}</p>}
    </fieldset>
}
