'use client'

import ItemProfissional from './ItemProfissional'
import TituloSecao from '../shared/TituloSecao'
import useProfissionais from '../../data/hooks/useProfissionais'

export default function NossosProfissionais() {
    const { profissionais } = useProfissionais()
    return (
        <div className="flex flex-col gap-y-16">
            <TituloSecao
                tag="Profissionais"
                principal="Especialistas Disponíveis"
                secundario="Conheça profissionais cadastrados e escolha quem combina melhor com o atendimento que você procura."
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {profissionais.map((profissional) => (
                    <ItemProfissional key={profissional.id} profissional={profissional} />
                ))}
            </div>
        </div>
    )
}
