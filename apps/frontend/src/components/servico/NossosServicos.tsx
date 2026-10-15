'use client'

import ItemServico from './ItemServico'
import TituloSecao from '../shared/TituloSecao'
import useServicosPublicos from '../../data/hooks/useServicosPublicos'

export default function NossosServicos() {
    const { servicos, carregando, erro, carregarServicos } = useServicosPublicos()

    return (
        <div className="flex flex-col gap-y-16">
            <TituloSecao
                tag="Serviços"
                principal="Serviços Para Você"
                secundario="Conheça os serviços de beleza, estética e bem-estar oferecidos pelos estabelecimentos publicados na plataforma."
            />
            {carregando ? <p role="status" className="text-center text-muted-foreground">Carregando serviços...</p> : null}
            {erro ? <div role="alert" className="text-center"><p>{erro}</p><button type="button" onClick={() => { void carregarServicos() }} className="mt-3 rounded-lg border border-border px-4 py-2">Tentar novamente</button></div> : null}
            {!carregando && !erro && !servicos.length ? <p className="text-center text-muted-foreground">Nenhum serviço disponível no momento.</p> : null}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {servicos.map((servico) => (
                    <ItemServico key={servico.id} servico={servico} estabelecimento={servico.estabelecimento} />
                ))}
            </div>
        </div>
    )
}
